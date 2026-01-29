const cron = require('node-cron');
const { fetchContests } = require('./contestService');
const User = require('../models/User');
const { sendEmail } = require('./emailService');

const startScheduler = () => {
    // Run every hour to check for upcoming contests
    cron.schedule('0 * * * *', async () => {
        console.log('Running notification scheduler...');
        try {
            const contests = await fetchContests();
            const users = await User.find({});
            const now = new Date();

            for (const user of users) {
                // If user has no notifications enabled, skip
                if (!user.channels?.email) continue;

                for (const contest of contests) {
                    const contestStart = new Date(contest.start);
                    const timeDiff = contestStart - now;
                    const hoursUntilStart = timeDiff / (1000 * 60 * 60);

                    // Logic for 1 Day Reminder (23.5 - 24.5 hours window)
                    if (user.reminders?.oneDay && hoursUntilStart >= 23.5 && hoursUntilStart <= 24.5) {
                        await sendNotification(user, contest, 'REMINDER_1_DAY');
                    }

                    // Logic for 2 Days Reminder (47.5 - 48.5 hours window)
                    if (user.reminders?.twoDays && hoursUntilStart >= 47.5 && hoursUntilStart <= 48.5) {
                        await sendNotification(user, contest, 'REMINDER_2_DAY');
                    }
                }
            }
        } catch (error) {
            console.error("Scheduler error:", error);
        }
    });
};

const sendNotification = async (user, contest, type) => {
    // Check history to avoid duplicates
    const alreadySent = user.notificationHistory.some(
        n => n.contestId === contest.title && n.type === type // Using title as ID for now, ideally simplify or use generated ID
    );

    if (alreadySent) return;

    let emailSent = false;

    const subject = `Upcoming Contest: ${contest.title}`;
    const message = `Don't forget! ${contest.title} on ${contest.platform} starts at ${new Date(contest.start).toLocaleString()}.`;

    // Send Email
    if (user.channels?.email) {
        emailSent = await sendEmail(user.email, subject, message, message);
    }

    // Add to history if at least one succeeded
    if (emailSent) {
        user.notificationHistory.push({
            type,
            contestId: contest.title,
            channel: 'EMAIL',
            status: 'SENT'
        });
        await user.save();
    }
};



module.exports = { startScheduler };
