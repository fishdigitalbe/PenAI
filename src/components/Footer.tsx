import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Mail, MapPin, Phone } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-6 h-6 text-blue-400" />
              <span className="text-white font-bold text-lg">PenAI.be</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              {t.footerDescription}
            </p>
            <div className="flex items-start gap-2 text-sm mb-2">
              <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
              <div>
                <p>FishDigital BV</p>
                <p>Boerenkrijgstraat 10</p>
                <p>2800 Mechelen, België</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm mb-2">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <a href="mailto:info@fishdigital.be" className="hover:text-blue-400 transition-colors">
                info@fishdigital.be
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <a href="tel:+32123456789" className="hover:text-blue-400 transition-colors">
                +32 473 47 13 61
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t.footerLegal}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/algemene-voorwaarden" className="hover:text-blue-400 transition-colors">
                  {t.footerTerms}
                </Link>
              </li>
              <li>
                <a href="/privacy-policy" className="hover:text-blue-400 transition-colors">
                  {t.footerPrivacy}
                </a>
              </li>
              <li>
                <Link to="/cookie-policy" className="hover:text-blue-400 transition-colors">
                  {t.footerCookies}
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" className="hover:text-blue-400 transition-colors">
                  {t.footerDisclaimer}
                </Link>
              </li>
              <li>
                <Link to="/herroepingsrecht" className="hover:text-blue-400 transition-colors">
                  {t.footerWithdrawal}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t.footerCompanyInfo}</h3>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-400">
                <span className="text-gray-500">{t.footerCompanyNumber}</span>
                <br />
                0635708207
              </li>
              <li className="text-gray-400">
                <span className="text-gray-500">{t.footerVatNumber}</span>
                <br />
                BE 0635.708.207
              </li>
              <li className="text-gray-400">
                <span className="text-gray-500">{t.footerRpr}</span>
                <br />
                Mechelen
              </li>
              <li className="text-gray-400">
                <span className="text-gray-500">{t.footerIban}</span>
                <br />
                BE29 7360 1688 7764
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {currentYear} Fish Digital. {t.footerRights}
            </p>
            <p className="text-xs text-gray-500">
              {t.footerSecure}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-800">
          <p className="text-xs text-gray-500 text-center max-w-4xl mx-auto leading-relaxed">
            <strong className="text-gray-400">{t.footerCompliance}</strong> {t.footerComplianceText}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 ml-1">
              {t.footerOdrPlatform}
            </a>.
            {t.footerComplaintsText}{' '}
            <a href="https://www.consumentenombudsdienst.be" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
              consumentenombudsdienst.be
            </a>.
          </p>
        </div>
      </div>
    </footer>
  );
}
