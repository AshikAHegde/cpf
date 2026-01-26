import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { Link, useLocation } from 'react-router-dom';

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Calendar', href: '/calendar' },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Navbar() {
  const location = useLocation();

  return (
    <Disclosure as="nav" className="sticky top-0 bg-[#0a0a0f]/70 backdrop-blur-xl border-b border-white/5 z-50 transition-all duration-300">
      <div className="mx-auto max-w-[1600px] px-4 md:px-8">
        <div className="relative flex h-24 items-center justify-between">
          <div className="flex items-center sm:hidden mr-2">
            {/* Mobile menu button*/}
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="block size-8 group-data-open:hidden" />
              <XMarkIcon aria-hidden="true" className="hidden size-8 group-data-open:block" />
            </DisclosureButton>
          </div>

          {/* Left: Logo */}
          <div className="flex shrink-0 items-center gap-2 sm:items-stretch sm:justify-start">
            <span className="text-white font-extrabold text-3xl tracking-tight">ContestPlatform</span>
          </div>

          {/* Center: Navigation Links (Desktop) */}
          <div className="hidden sm:block absolute left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-8">
              {navigation.map((item) => {
                const isCurrent = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    aria-current={isCurrent ? 'page' : undefined}
                    className={classNames(
                      isCurrent
                        ? 'text-white font-bold'
                        : 'text-gray-400 hover:text-white',
                      'px-3 py-2 text-lg transition-colors',
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right: Icons & Profile */}
          <div className="flex items-center gap-2 sm:ml-6">
            <Link
              to="/profile"
              className="relative rounded-full p-2 text-gray-400 hover:text-white focus:outline-none transition-colors"
            >
              <span className="absolute -inset-1.5" />
              <span className="sr-only">My Profile</span>
              <Cog6ToothIcon aria-hidden="true" className="size-8" />
            </Link>


          </div>
        </div>
      </div>

      <DisclosurePanel className="sm:hidden border-t border-gray-700 bg-[#0a0a0f]">
        <div className="space-y-1 px-2 pb-3 pt-2">
          {navigation.map((item) => (
            <DisclosureButton
              key={item.name}
              as={Link}
              to={item.href}
              className={classNames(
                location.pathname === item.href ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                'block rounded-md px-3 py-2 text-base font-medium',
              )}
            >
              {item.name}
            </DisclosureButton>
          ))}
        </div>
      </DisclosurePanel>
    </Disclosure>
  )
}
