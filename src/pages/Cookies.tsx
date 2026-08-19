import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';

export default function Cookies() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8 lg:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cookiebeleid – PenAI.be</h1>
          <p className="text-sm text-gray-600 mb-8">Laatst bijgewerkt: <strong>04/12/2025</strong></p>

          <div className="prose prose-gray max-w-none">
            <p>
              Dit cookiebeleid legt uit wat cookies zijn, hoe <strong>PenAI.be</strong> (beheerd door FishDigital BV) cookies gebruikt,
              en hoe je je cookie-instellingen kunt beheren.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Wat zijn cookies?</h2>
            <p>
              Cookies zijn kleine tekstbestanden die op je apparaat (computer, tablet of smartphone) worden opgeslagen wanneer je een website bezoekt.
              Ze helpen websites om je apparaat te herkennen en bepaalde informatie over je voorkeuren of eerdere bezoeken op te slaan.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Waarom gebruiken we cookies?</h2>
            <p>We gebruiken cookies voor verschillende doeleinden:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Essentiële cookies:</strong> noodzakelijk voor de werking van de website (bijv. inloggen, winkelwagen)</li>
              <li><strong>Functionele cookies:</strong> onthouden je voorkeuren (bijv. taalvoorkeur)</li>
              <li><strong>Analytische cookies:</strong> meten websiteverkeer en gebruikspatronen om onze diensten te verbeteren</li>
              <li><strong>Marketing cookies:</strong> tonen relevante advertenties en meten de effectiviteit van campagnes</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Welke cookies gebruiken we?</h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.1 Essentiële cookies (altijd actief)</h3>
            <p>Deze cookies zijn noodzakelijk voor de basisfunctionaliteit van de website en kunnen niet worden uitgeschakeld.</p>
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Cookie</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Doel</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Bewaartermijn</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">sb-access-token</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Authenticatie en sessie</td>
                    <td className="px-4 py-3 text-sm text-gray-700">1 jaar</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">sb-refresh-token</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Verlengen van sessie</td>
                    <td className="px-4 py-3 text-sm text-gray-700">1 jaar</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.2 Functionele cookies</h3>
            <p>Deze cookies onthouden je voorkeuren en keuzes.</p>
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Cookie</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Doel</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Bewaartermijn</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">language_preference</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Onthouden van taalvoorkeur</td>
                    <td className="px-4 py-3 text-sm text-gray-700">1 jaar</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">cookie_consent</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Opslaan van cookie-voorkeuren</td>
                    <td className="px-4 py-3 text-sm text-gray-700">1 jaar</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.3 Analytische cookies</h3>
            <p>
              We gebruiken mogelijk analytics-diensten om te begrijpen hoe bezoekers onze website gebruiken. Deze informatie wordt gebruikt
              om de website te verbeteren en de gebruikerservaring te optimaliseren.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.4 Cookies van derde partijen</h3>
            <p>Onze website maakt gebruik van diensten van derde partijen die mogelijk cookies plaatsen:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Stripe:</strong> betalingsverwerking (essentieel)</li>
              <li><strong>Supabase:</strong> hosting en authenticatie (essentieel)</li>
            </ul>
            <p className="mt-4">
              Deze derde partijen hebben hun eigen privacybeleid. We raden je aan deze te raadplegen voor meer informatie over hun gebruik van cookies.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Hoe kan je cookies beheren?</h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.1 Via je browser</h3>
            <p>
              De meeste browsers staan je standaard toe om cookies te accepteren, maar je kunt je browserinstellingen aanpassen om:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Alle cookies te blokkeren</li>
              <li>Alleen cookies van derde partijen te blokkeren</li>
              <li>Alle cookies te verwijderen wanneer je de browser sluit</li>
              <li>Een melding te krijgen voordat een cookie wordt opgeslagen</li>
            </ul>
            <p className="mt-4">Instructies per browser:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/nl/kb/cookies-verwijderen-gegevens-wissen-websites-opgeslagen" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/nl-be/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Safari</a></li>
              <li><a href="https://support.microsoft.com/nl-nl/microsoft-edge/cookies-verwijderen-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Microsoft Edge</a></li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.2 Gevolgen van het blokkeren van cookies</h3>
            <p>
              Let op: als je cookies blokkeert of verwijdert, kan dit invloed hebben op de functionaliteit van onze website.
              Bepaalde functies werken mogelijk niet correct, en je voorkeuren kunnen niet worden opgeslagen.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Do Not Track</h2>
            <p>
              Sommige browsers hebben een "Do Not Track" (DNT) functie. Omdat er nog geen universele standaard is voor DNT-signalen,
              reageert onze website momenteel niet op DNT-verzoeken. We respecteren echter wel alle cookie-instellingen die je handmatig configureert.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Wijzigingen in dit cookiebeleid</h2>
            <p>
              We kunnen dit cookiebeleid van tijd tot tijd bijwerken om wijzigingen in onze praktijken of om wettelijke redenen te weerspiegelen.
              De meest recente versie wordt altijd op deze pagina gepubliceerd met de datum van laatste wijziging.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Meer informatie</h2>
            <p>
              Voor meer informatie over cookies, kun je terecht op{' '}
              <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                www.allaboutcookies.org
              </a> of{' '}
              <a href="https://www.youronlinechoices.eu" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                www.youronlinechoices.eu
              </a>.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Contact</h2>
            <p>
              Voor vragen over ons gebruik van cookies kun je contact opnemen met:
            </p>
            <p className="mt-2">
              <strong>FishDigital BV</strong><br />
              Boerenkrijgstraat 10<br />
              2800 Mechelen, België<br />
              E-mail: <a href="mailto:info@fishdigital.be" className="text-blue-600 hover:underline">info@fishdigital.be</a><br />
              Tel: <a href="tel:+32473471361" className="text-blue-600 hover:underline">+32 473 47 13 61</a>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
