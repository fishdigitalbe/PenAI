import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8 lg:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Disclaimer – PenAI.be</h1>
          <p className="text-sm text-gray-600 mb-8">Laatst bijgewerkt: <strong>04/12/2025</strong></p>

          <div className="prose prose-gray max-w-none">
            <p>
              Deze disclaimer is van toepassing op de website <a href="https://www.penai.be" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.penai.be</a> en
              alle diensten die door <strong>FishDigital BV</strong> (hierna: "PenAI", "wij" of "ons") worden aangeboden via dit platform.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Algemeen</h2>
            <p>
              De informatie op deze website wordt aangeboden "zoals het is" ("as is") zonder enige vorm van garantie, expliciet of impliciet.
              Hoewel wij ons best doen om nauwkeurige, actuele en volledige informatie te verstrekken, kunnen wij niet garanderen dat alle
              informatie op de website te allen tijde juist, volledig of actueel is.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Geen Professioneel Advies</h2>
            <p>
              De content die via PenAI wordt gegenereerd, is bedoeld voor informatieve en creatieve doeleinden en vormt geen professioneel,
              juridisch, financieel, medisch of ander gespecialiseerd advies. Voor dergelijk advies moet je altijd een gekwalificeerde professional raadplegen.
            </p>
            <p className="mt-4">
              PenAI is een AI-gestuurde dienst die automatisch content genereert. De gegenereerde output kan:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Onnauwkeurigheden bevatten</li>
              <li>Onvolledige informatie bevatten</li>
              <li>Contextueel onjuiste interpretaties bevatten</li>
              <li>Niet geschikt zijn voor alle doeleinden</li>
            </ul>
            <p className="mt-4">
              <strong>Het is jouw verantwoordelijkheid</strong> om de gegenereerde content te verifiëren, aan te passen en te beoordelen
              op geschiktheid voor het beoogde gebruik.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. AI-gegenereerde Content</h2>
            <p>
              PenAI maakt gebruik van geavanceerde AI-technologie (waaronder Large Language Models) om content te genereren.
              Deze technologie heeft beperkingen:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Feitelijke onjuistheden:</strong> AI kan onjuiste of verouderde informatie genereren</li>
              <li><strong>Hallucinaties:</strong> AI kan informatie verzinnen die niet gebaseerd is op feiten</li>
              <li><strong>Vooringenomenheid:</strong> AI-modellen kunnen onbedoelde bias bevatten</li>
              <li><strong>Taalfouten:</strong> grammaticale, spelling- of stijlfouten kunnen voorkomen</li>
              <li><strong>Culturele gevoeligheid:</strong> content kan cultureel ongepast zijn in bepaalde contexten</li>
            </ul>
            <p className="mt-4">
              Door gebruik te maken van PenAI erken je deze beperkingen en ga je akkoord dat wij niet verantwoordelijk zijn voor
              eventuele schade die voortvloeit uit het gebruik van de gegenereerde content.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Intellectuele Eigendom</h2>
            <p>
              Hoewel je de rechten verkrijgt op de door PenAI gegenereerde output (zoals beschreven in onze Algemene Voorwaarden),
              kunnen we niet garanderen dat:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>De content geen inbreuk maakt op intellectuele eigendomsrechten van derden</li>
              <li>De content volledig uniek en origineel is</li>
              <li>De content vrij is van auteursrechtelijke bescherming</li>
            </ul>
            <p className="mt-4">
              Het is jouw verantwoordelijkheid om te controleren of de content geschikt is voor publicatie en geen inbreuk maakt
              op rechten van derden voordat je deze publiceert of commercieel gebruikt.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Geen Garanties</h2>
            <p>PenAI geeft geen garanties met betrekking tot:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>De nauwkeurigheid, betrouwbaarheid of volledigheid van de gegenereerde content</li>
              <li>De geschiktheid van de content voor een specifiek doel</li>
              <li>Ononderbroken beschikbaarheid van de diensten</li>
              <li>De afwezigheid van virussen of andere schadelijke componenten</li>
              <li>De veiligheid van gegevensoverdracht via internet</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Beperking van Aansprakelijkheid</h2>
            <p>
              PenAI en FishDigital BV zijn niet aansprakelijk voor enige directe, indirecte, incidentele, bijzondere of gevolgschade
              die voortvloeit uit:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Het gebruik of de onmogelijkheid tot gebruik van de website of diensten</li>
              <li>Fouten, onnauwkeurigheden of tekortkomingen in de gegenereerde content</li>
              <li>Beslissingen die je neemt op basis van de gegenereerde content</li>
              <li>Verlies van gegevens, inkomsten, winst of goodwill</li>
              <li>Publicatie of distributie van de gegenereerde content</li>
              <li>Claims van derden met betrekking tot intellectuele eigendomsrechten</li>
            </ul>
            <p className="mt-4">
              Deze beperking geldt in de maximale mate die door de wet is toegestaan, ook als we op de hoogte zijn gebracht
              van de mogelijkheid van dergelijke schade.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Links naar Externe Websites</h2>
            <p>
              Onze website kan links bevatten naar websites van derden. Deze links worden uitsluitend voor je gemak verstrekt.
              We hebben geen controle over de inhoud van deze externe websites en zijn niet verantwoordelijk voor:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>De inhoud, nauwkeurigheid of beschikbaarheid van externe websites</li>
              <li>Het privacy- of beveiligingsbeleid van externe websites</li>
              <li>Enige schade of verlies veroorzaakt door het gebruik van externe websites</li>
            </ul>
            <p className="mt-4">
              Het opnemen van een link impliceert geen goedkeuring of onderschrijving van de externe website of haar content.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Technische Problemen</h2>
            <p>
              We streven ernaar om de website en diensten zo veel mogelijk beschikbaar te houden, maar kunnen niet garanderen dat:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>De diensten ononderbroken of foutloos zullen werken</li>
              <li>Fouten altijd zullen worden gecorrigeerd</li>
              <li>De diensten vrij zullen zijn van virussen of andere schadelijke componenten</li>
              <li>Resultaten die worden verkregen door het gebruik van de diensten accuraat of betrouwbaar zijn</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Wijzigingen</h2>
            <p>
              We behouden ons het recht voor om:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>De inhoud van de website en diensten op elk moment te wijzigen of te verwijderen</li>
              <li>De diensten tijdelijk of permanent te onderbreken</li>
              <li>Deze disclaimer op elk moment bij te werken</li>
            </ul>
            <p className="mt-4">
              zonder voorafgaande kennisgeving en zonder aansprakelijkheid jegens jou of derden.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Toepasselijk Recht</h2>
            <p>
              Deze disclaimer wordt beheerst door en geïnterpreteerd in overeenstemming met het Belgisch recht.
              Eventuele geschillen die voortvloeien uit of verband houden met deze disclaimer zullen worden voorgelegd
              aan de bevoegde rechtbanken van België.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Scheidbaarheid</h2>
            <p>
              Als een bepaling van deze disclaimer ongeldig, onwettig of niet-afdwingbaar wordt geacht, blijven de overige
              bepalingen volledig van kracht.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Contact</h2>
            <p>
              Voor vragen over deze disclaimer kun je contact opnemen met:
            </p>
            <p className="mt-2">
              <strong>FishDigital BV</strong><br />
              Boerenkrijgstraat 10<br />
              2800 Mechelen, België<br />
              E-mail: <a href="mailto:info@fishdigital.be" className="text-blue-600 hover:underline">info@fishdigital.be</a><br />
              Tel: <a href="tel:+32473471361" className="text-blue-600 hover:underline">+32 473 47 13 61</a>
            </p>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Belangrijke herinnering:</strong> Gebruik altijd je eigen oordeel en verifieer de gegenereerde content
                    voordat je deze gebruikt, publiceert of deelt. AI is een hulpmiddel, geen vervanging voor menselijk inzicht en expertise.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
