import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, LogOut, FolderOpen, Settings, Store, Menu, BookOpen, PenTool, Package, DollarSign, Lightbulb, Home, Linkedin, Facebook, Sparkles, TrendingUp, Recycle, Calendar, ChevronDown, Wrench } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../lib/LanguageContext';

export function Navigation() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setToolsMenuOpen(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    signOut();
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const closeAllMenus = () => {
    setToolsMenuOpen(false);
    setAccountMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <img
              src="/PenAI.png"
              alt="Penai.be"
              className="h-12 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            <Link
              to="/"
              onClick={closeAllMenus}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors ${
                location.pathname === '/' ? 'bg-blue-50 text-blue-600' : ''
              }`}
            >
              <Home className="h-4 w-4" />
              <span className="text-sm font-medium">{t.home}</span>
            </Link>

            {/* Tools Megamenu */}
            <div className="relative" ref={toolsMenuRef}>
              <button
                onClick={() => {
                  setToolsMenuOpen(!toolsMenuOpen);
                  setAccountMenuOpen(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors ${
                  toolsMenuOpen || ['/content-strategy-planner', '/strategy-result', '/trending-topics', '/content-repurposing', '/content-calendar'].some(path => location.pathname.startsWith(path))
                    ? 'bg-blue-50 text-blue-600'
                    : ''
                }`}
              >
                <Wrench className="h-4 w-4" />
                <span className="text-sm font-medium">Tools</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${toolsMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {toolsMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-4 z-50">
                  <div className="px-4 py-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Content Tools</p>
                    <div className="space-y-1">
                      <Link
                        to="/content-strategy-planner"
                        onClick={() => setToolsMenuOpen(false)}
                        className={`flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-blue-50 transition-colors ${
                          location.pathname.startsWith('/content-strategy') || location.pathname.startsWith('/strategy-result')
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700'
                        }`}
                      >
                        <Sparkles className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">{t.contentStrategyPlanner}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Creëer complete content strategieën</p>
                        </div>
                      </Link>

                      <Link
                        to="/trending-topics"
                        onClick={() => setToolsMenuOpen(false)}
                        className={`flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-blue-50 transition-colors ${
                          location.pathname === '/trending-topics' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        <TrendingUp className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">Trending Topics</p>
                          <p className="text-xs text-gray-500 mt-0.5">Ontdek actuele content ideeën</p>
                        </div>
                      </Link>

                      <Link
                        to="/content-repurposing"
                        onClick={() => setToolsMenuOpen(false)}
                        className={`flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-green-50 transition-colors ${
                          location.pathname === '/content-repurposing' ? 'bg-green-50 text-green-600' : 'text-gray-700'
                        }`}
                      >
                        <Recycle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">Content Repurposing</p>
                          <p className="text-xs text-gray-500 mt-0.5">Hergebruik content efficiënt</p>
                        </div>
                      </Link>

                      <Link
                        to="/content-calendar"
                        onClick={() => setToolsMenuOpen(false)}
                        className={`flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-blue-50 transition-colors ${
                          location.pathname === '/content-calendar' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        <Calendar className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">Content Kalender</p>
                          <p className="text-xs text-gray-500 mt-0.5">Plan je content vooruit</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/blog"
              onClick={closeAllMenus}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors ${
                location.pathname.startsWith('/blog') && location.pathname !== '/blog-admin' ? 'bg-blue-50 text-blue-600' : ''
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span className="text-sm font-medium">{t.blog}</span>
            </Link>

            <Link
              to="/inspiration"
              onClick={closeAllMenus}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors ${
                location.pathname === '/inspiration' ? 'bg-blue-50 text-blue-600' : ''
              }`}
            >
              <Lightbulb className="h-4 w-4" />
              <span className="text-sm font-medium">{t.inspiration}</span>
            </Link>

            <Link
              to="/pricing"
              onClick={closeAllMenus}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors ${
                location.pathname === '/pricing' ? 'bg-blue-50 text-blue-600' : ''
              }`}
            >
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">{t.pricing}</span>
            </Link>

            <Link
              to="/about"
              onClick={closeAllMenus}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors ${
                location.pathname === '/about' ? 'bg-blue-50 text-blue-600' : ''
              }`}
            >
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">Over ons</span>
            </Link>

            <div className="ml-2 pl-2 border-l border-gray-200 flex items-center gap-1">
              {user ? (
                <>
                  {/* Account Megamenu */}
                  <div className="relative" ref={accountMenuRef}>
                    <button
                      onClick={() => {
                        setAccountMenuOpen(!accountMenuOpen);
                        setToolsMenuOpen(false);
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors ${
                        accountMenuOpen || ['/portal', '/profile', '/shopify', '/linkedin', '/meta'].some(path => location.pathname === path)
                          ? 'bg-blue-50 text-blue-600'
                          : ''
                      }`}
                    >
                      <User className="h-4 w-4" />
                      <span className="text-sm font-medium">Mijn Account</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {accountMenuOpen && (
                      <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-4 z-50">
                        <div className="px-4 py-2">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Account</p>
                          <div className="space-y-1">
                            <Link
                              to="/portal"
                              onClick={() => setAccountMenuOpen(false)}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors ${
                                location.pathname === '/portal' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                              }`}
                            >
                              <FolderOpen className="h-4 w-4" />
                              <span className="font-medium text-sm">{t.customerPortal}</span>
                            </Link>
                            <Link
                              to="/profile"
                              onClick={() => setAccountMenuOpen(false)}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors ${
                                location.pathname === '/profile' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                              }`}
                            >
                              <Settings className="h-4 w-4" />
                              <span className="font-medium text-sm">{t.profile}</span>
                            </Link>
                          </div>

                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-3">Integraties</p>
                          <div className="space-y-1">
                            <Link
                              to="/shopify"
                              onClick={() => setAccountMenuOpen(false)}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 transition-colors ${
                                location.pathname === '/shopify' ? 'bg-green-50 text-green-600' : 'text-gray-700'
                              }`}
                            >
                              <Store className="h-4 w-4" />
                              <span className="font-medium text-sm">{t.shopify}</span>
                            </Link>
                            <Link
                              to="/linkedin"
                              onClick={() => setAccountMenuOpen(false)}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors ${
                                location.pathname === '/linkedin' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                              }`}
                            >
                              <Linkedin className="h-4 w-4" />
                              <span className="font-medium text-sm">LinkedIn</span>
                            </Link>
                            <Link
                              to="/meta"
                              onClick={() => setAccountMenuOpen(false)}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors ${
                                location.pathname === '/meta' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                              }`}
                            >
                              <Facebook className="h-4 w-4" />
                              <span className="font-medium text-sm">Meta</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {user.email === 'stein@fishdigital.be' && (
                    <Link
                      to="/blog-admin"
                      onClick={closeAllMenus}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors ${
                        location.pathname === '/blog-admin' ? 'bg-blue-50 text-blue-600' : ''
                      }`}
                    >
                      <PenTool className="h-4 w-4" />
                      <span className="text-sm font-medium">{t.admin}</span>
                    </Link>
                  )}

                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm font-medium">{t.logout}</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">{t.login}</span>
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <span className="text-sm font-medium">{t.signup}</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50"
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white shadow-lg">
            <div className="py-4 px-2 space-y-1">
              <div className="pb-3 mb-3 border-b border-gray-200">
                <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t.navigation}
                </p>
                <Link
                  to="/"
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === '/'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Home className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{t.home}</span>
                </Link>
                <Link
                  to="/pricing"
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === '/pricing'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <DollarSign className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{t.pricing}</span>
                </Link>
                <Link
                  to="/about"
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === '/about'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">Over ons</span>
                </Link>
                <Link
                  to="/inspiration"
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === '/inspiration'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Lightbulb className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{t.inspiration}</span>
                </Link>
                <Link
                  to="/blog"
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname.startsWith('/blog')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <BookOpen className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{t.blog}</span>
                </Link>
                <Link
                  to="/content-strategy-planner"
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname.startsWith('/content-strategy') || location.pathname.startsWith('/strategy-result')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Sparkles className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{t.contentStrategyPlanner}</span>
                </Link>
                <Link
                  to="/trending-topics"
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === '/trending-topics'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <TrendingUp className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">Trending Topics</span>
                </Link>
                <Link
                  to="/content-repurposing"
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === '/content-repurposing'
                      ? 'bg-green-50 text-green-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Recycle className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">Repurposing</span>
                </Link>
                <Link
                  to="/content-calendar"
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === '/content-calendar'
                      ? 'bg-purple-50 text-purple-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Calendar className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">Kalender</span>
                </Link>
              </div>

              {user ? (
                <div className="space-y-1">
                  <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t.myAccount}
                  </p>
                  <Link
                    to="/portal"
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      location.pathname === '/portal'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <FolderOpen className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">{t.myCustomerPortal}</span>
                  </Link>
                  <Link
                    to="/profile"
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      location.pathname === '/profile'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Settings className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">{t.profile}</span>
                  </Link>
                  <Link
                    to="/shopify"
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      location.pathname === '/shopify'
                        ? 'bg-green-50 text-green-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Store className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">{t.shopify}</span>
                  </Link>
                  <Link
                    to="/linkedin"
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      location.pathname === '/linkedin'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Linkedin className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">LinkedIn</span>
                  </Link>
                  <Link
                    to="/meta"
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      location.pathname === '/meta'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Facebook className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">Meta</span>
                  </Link>
                  {user.email === 'stein@fishdigital.be' && (
                    <Link
                      to="/blog-admin"
                      onClick={closeMobileMenu}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        location.pathname === '/blog-admin'
                          ? 'bg-purple-50 text-purple-600'
                          : 'text-purple-600 hover:bg-purple-50'
                      }`}
                    >
                      <PenTool className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium">{t.blogAdmin}</span>
                    </Link>
                  )}
                  <div className="pt-3 mt-3 border-t border-gray-200">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                    >
                      <LogOut className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium">{t.logout}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t.account}
                  </p>
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">{t.login}</span>
                  </Link>
                  <div className="px-4 pt-2">
                    <Link
                      to="/signup"
                      onClick={closeMobileMenu}
                      className="flex items-center justify-center w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                    >
                      {t.signup}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}