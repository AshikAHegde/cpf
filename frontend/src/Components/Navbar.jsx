import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Link, useLocation } from 'react-router-dom';

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Calendar', href: '/calendar' },
  { name: 'Team', href: '/team' },
  { name: 'Projects', href: '/projects' },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Navbar() {
  const location = useLocation();

  return (
    <Disclosure
      as="nav"
      className="sticky top-0 bg-[#0a0a0f]/80 border-b border-white/5 backdrop-blur-xl z-50 transform transition-all duration-300"
    >
      <div className="mx-auto max-w-[1600px] px-4 md:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            {/* Mobile menu button*/}
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white focus:outline-none ring-1 ring-white/5">
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
              <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
            </DisclosureButton>
          </div>

          {/* Left: Logo */}
          <div className="flex shrink-0 items-center gap-3 flex-1 sm:items-stretch sm:justify-start">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight hidden md:block">ContestPlatform</span>
          </div>

          {/* Center: Navigation Links (Desktop) */}
          <div className="hidden sm:block absolute left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-1 bg-white/5 p-1 rounded-xl border border-white/5 backdrop-blur-md">
              {navigation.map((item) => {
                const isCurrent = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    aria-current={isCurrent ? 'page' : undefined}
                    className={classNames(
                      isCurrent 
                        ? 'bg-gray-800 text-white shadow-md' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5',
                      'rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right: Icons & Profile */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0 gap-4">
            <button
              type="button"
              className="relative rounded-lg p-2 text-gray-400 hover:text-white hover:bg-white/5 focus:outline-none transition-colors"
            >
              <span className="absolute -inset-1.5" />
              <span className="sr-only">View notifications</span>
              <BellIcon aria-hidden="true" className="size-6" />
              <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-[#0a0a0f]" />
            </button>

            {/* Profile dropdown */}
            <Menu as="div" className="relative ml-3">
              <MenuButton className="relative flex rounded-full ring-2 ring-white/10 hover:ring-blue-500/50 transition-all focus:outline-none">
                <span className="absolute -inset-1.5" />
                <span className="sr-only">Open user menu</span>
                <img
                  alt=""
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  className="size-9 rounded-full bg-gray-800"
                />
              </MenuButton>

              <MenuItems
                transition
                className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-xl bg-[#13131f] py-2 shadow-2xl ring-1 ring-white/10 transition focus:outline-none data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
              >
                <div className="px-4 py-3 border-b border-white/5 mb-2">
                    <p className="text-sm text-white font-medium">Ashik Hegde</p>
                    <p className="text-xs text-gray-400 truncate">ashik@example.com</p>
                </div>
                
                <MenuItem>
                  <Link
                    to="#"
                    className="block px-4 py-2 text-sm text-gray-300 data-focus:bg-white/5 data-focus:text-blue-400 transition-colors"
                  >
                    Your profile
                  </Link>
                </MenuItem>
                <MenuItem>
                  <Link
                    to="#"
                    className="block px-4 py-2 text-sm text-gray-300 data-focus:bg-white/5 data-focus:text-blue-400 transition-colors"
                  >
                    Settings
                  </Link>
                </MenuItem>
                <div className="border-t border-white/5 mt-2 pt-2">
                    <MenuItem>
                    <Link
                        to="#"
                        className="block px-4 py-2 text-sm text-red-400 data-focus:bg-red-500/10 transition-colors"
                    >
                        Sign out
                    </Link>
                    </MenuItem>
                </div>
              </MenuItems>
            </Menu>
          </div>
        </div>
      </div>

      <DisclosurePanel className="sm:hidden border-t border-white/5 bg-[#0a0a0f]">
        <div className="space-y-1 px-4 pt-3 pb-4">
          {navigation.map((item) => {
             const isCurrent = location.pathname === item.href;
             return (
              <DisclosureButton
                key={item.name}
                as={Link}
                to={item.href}
                aria-current={isCurrent ? 'page' : undefined}
                className={classNames(
                  isCurrent ? 'bg-blue-600/10 text-blue-400 ring-1 ring-blue-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white',
                  'block rounded-lg px-3 py-2.5 text-base font-medium transition-all',
                )}
              >
                {item.name}
              </DisclosureButton>
            );
          })}
        </div>
      </DisclosurePanel>
    </Disclosure>
  )
}
