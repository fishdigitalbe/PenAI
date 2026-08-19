import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8 lg:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacybeleid – PenAI.be</h1>
          <p className="text-sm text-gray-600 mb-8">Laatst bijgewerkt: <strong>04/12/2025</strong></p>

          <div className="prose prose-gray max-w-none">
            <p>
              <strong>FishDigital BV</strong> (hierna: "wij", "ons" of "PenAI") hecht groot belang aan de bescherming van je privacy.
              In dit privacybeleid leggen we uit welke persoonsgegevens we verzamelen, waarom we deze verzamelen en hoe we deze gebruiken
              wanneer je gebruikmaakt van <a href="https://www.penai.be" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.penai.be</a> en onze diensten.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Wie is verantwoordelijk voor je gegevens?</h2>
            <p><strong>Verwerkingsverantwoordelijke:</strong></p>
            <p>
              FishDigital BV<br />
              Boerenkrijgstraat 10<br />
              2800 Mechelen, België<br />
              Ondernemingsnummer: 0635.708.207<br />
              E-mail: <a href="mailto:info@fishdigital.be" className="text-blue-600 hover:underline">info@fishdigital.be</a><br />
              Tel: <a href="tel:+32473471361" className="text-blue-600 hover:underline">+32 473 47 13 61</a>
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Welke gegevens verzamelen we?</h2>
            <p>We kunnen de volgende categorieën persoonsgegevens verzamelen:</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.1 Gegevens die je zelf verstrekt</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Accountgegevens:</strong> naam, e-mailadres, wachtwoord (versleuteld opgeslagen)</li>
              <li><strong>Betalingsgegevens:</strong> facturatieadres, bedrijfsgegevens (indien van toepassing). Betalingen worden verwerkt via Stripe; creditcardgegevens worden niet door ons opgeslagen</li>
              <li><strong>Content:</strong> teksten, documenten of andere data die je uploadt voor gebruik van onze AI-diensten</li>
              <li><strong>Communicatie:</strong> berichten die je naar ons stuurt via e-mail of contactformulieren</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.2 Automatisch verzamelde gegevens</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Technische gegevens:</strong> IP-adres, browsertype, apparaattype, besturingssysteem</li>
              <li><strong>Gebruiksgegevens:</strong> bezochte pagina's, klikgedrag, tijdstip van bezoek, verwijzende website</li>
              <li><strong>Cookies:</strong> zie ons aparte cookiebeleid voor meer informatie</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Waarom en op welke basis verwerken we je gegevens?</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Uitvoering van de overeenkomst</h3>
                <p className="text-gray-700">
                  Om onze diensten te leveren, je account te beheren, betalingen te verwerken en klantenondersteuning te bieden.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Wettelijke verplichtingen</h3>
                <p className="text-gray-700">
                  Voor boekhouding, fiscale verplichtingen en archivering conform de Belgische wetgeving.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Gerechtvaardigd belang</h3>
                <p className="text-gray-700">
                  Voor verbetering van onze diensten, fraudepreventie, beveiliging en websiteoptimalisatie.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Toestemming</h3>
                <p className="text-gray-700">
                  Voor marketingcommunicatie (nieuwsbrieven) en niet-essentiële cookies. Je kunt je toestemming altijd intrekken.
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Met wie delen we je gegevens?</h2>
            <p>We delen je persoonsgegevens alleen met:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service providers:</strong> Supabase (hosting), Stripe (betalingen), OpenAI (AI-verwerking), e-mailproviders</li>
              <li><strong>Wettelijke verplichtingen:</strong> overheidsinstanties wanneer wettelijk verplicht</li>
            </ul>
            <p className="mt-4">
              Deze partijen fungeren als verwerkers en mogen je gegevens alleen gebruiken voor de doeleinden waarvoor wij ze hebben ingeschakeld.
              We verkopen je gegevens nooit aan derden.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Hoe lang bewaren we je gegevens?</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Accountgegevens:</strong> tot je je account verwijdert</li>
              <li><strong>Facturatiegegevens:</strong> 7 jaar (Belgische boekhoudwet)</li>
              <li><strong>Content en Output:</strong> 30 dagen na levering, tenzij je deze eerder verwijdert</li>
              <li><strong>Marketinggegevens:</strong> tot je uitschrijft uit de nieuwsbrief</li>
              <li><strong>Technische logs:</strong> maximaal 12 maanden</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Internationale gegevensoverdracht</h2>
            <p>
              Sommige van onze service providers (zoals OpenAI) kunnen gevestigd zijn buiten de Europese Economische Ruimte.
              We zorgen ervoor dat adequate waarborgen aanwezig zijn conform de GDPR, zoals:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>EU-goedgekeurde standaard contractuele clausules</li>
              <li>Adequaatheidsbesluit van de Europese Commissie</li>
              <li>Privacy Shield-certificering (indien van toepassing)</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Beveiliging</h2>
            <p>
              We nemen passende technische en organisatorische maatregelen om je persoonsgegevens te beschermen tegen ongeoorloofde toegang,
              verlies of wijziging:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>SSL/TLS-versleuteling voor alle gegevensoverdracht</li>
              <li>Versleutelde opslag van gevoelige gegevens</li>
              <li>Regelmatige beveiligingsupdates en audits</li>
              <li>Toegangscontrole en authenticatie</li>
              <li>Back-ups en herstelplannen</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Jouw rechten</h2>
            <p>Volgens de GDPR heb je de volgende rechten:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Recht op inzage:</strong> je kunt een kopie opvragen van je persoonsgegevens</li>
              <li><strong>Recht op rectificatie:</strong> je kunt onjuiste gegevens laten corrigeren</li>
              <li><strong>Recht op wissing:</strong> je kunt verzoeken je gegevens te verwijderen ("recht om vergeten te worden")</li>
              <li><strong>Recht op beperking:</strong> je kunt de verwerking van je gegevens laten beperken</li>
              <li><strong>Recht op dataportabiliteit:</strong> je kunt je gegevens in een gestructureerd formaat ontvangen</li>
              <li><strong>Recht van bezwaar:</strong> je kunt bezwaar maken tegen bepaalde verwerkingen</li>
              <li><strong>Recht om toestemming in te trekken:</strong> waar we op basis van toestemming werken</li>
            </ul>
            <p className="mt-4">
              Om deze rechten uit te oefenen, kun je contact opnemen via{' '}
              <a href="mailto:info@fishdigital.be" className="text-blue-600 hover:underline">info@fishdigital.be</a>.
              We reageren binnen 1 maand op je verzoek.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Klachten</h2>
            <p>
              Als je niet tevreden bent over hoe we met je persoonsgegevens omgaan, kun je een klacht indienen bij de{' '}
              <a href="https://www.gegevensbeschermingsautoriteit.be" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Belgische Gegevensbeschermingsautoriteit
              </a>:
            </p>
            <p className="mt-2">
              Drukpersstraat 35<br />
              1000 Brussel<br />
              Tel: +32 2 274 48 00<br />
              E-mail: contact@apd-gba.be
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Minderjarigen</h2>
            <p>
              Onze diensten zijn niet bedoeld voor personen jonger dan 16 jaar. We verzamelen niet bewust persoonsgegevens van minderjarigen
              zonder toestemming van ouders of voogd.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Wijzigingen</h2>
            <p>
              We kunnen dit privacybeleid van tijd tot tijd aanpassen. De meest recente versie wordt altijd op deze pagina gepubliceerd met
              de datum van laatste wijziging. Bij belangrijke wijzigingen zullen we je actief informeren via e-mail.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Contact</h2>
            <p>
              Voor vragen over dit privacybeleid of over hoe we je gegevens verwerken, kun je contact opnemen met:
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
