const mongoose = require('mongoose');





const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
    name: { type: String, default: '' },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    channels: {
        email: { type: Boolean, default: true }
    },
    reminders: {
        oneDay: { type: Boolean, default: false },
        twoDays: { type: Boolean, default: false }
    },
    notificationHistory: [
        {
            type: { type: String }, // 'REMINDER_1_DAY'
            contestId: String,
            channel: String, // 'EMAIL'
            status: String, // 'SENT', 'FAILED'
            timestamp: { type: Date, default: Date.now }
        }
    ]
});

// Hash password before saving
// Hash password before saving
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        throw err;
    }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
