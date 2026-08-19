import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';

export default function Withdrawal() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8 lg:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Herroepingsrecht – PenAI.be</h1>
          <p className="text-sm text-gray-600 mb-8">Laatst bijgewerkt: <strong>04/12/2025</strong></p>

          <div className="prose prose-gray max-w-none">
            <p>
              Als consument heb je volgens de Europese Richtlijn 2011/83/EU en de Belgische wetgeving inzake consumentenbescherming
              het recht om een overeenkomst op afstand te herroepen binnen een bepaalde termijn. Dit document legt uit hoe het herroepingsrecht
              van toepassing is op de diensten van <strong>PenAI.be</strong> (beheerd door FishDigital BV).
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Wie heeft recht op herroeping?</h2>
            <p>
              Het herroepingsrecht geldt alleen voor <strong>consumenten</strong>: natuurlijke personen die handelen voor doeleinden
              die buiten hun handels-, bedrijfs-, ambachts- of beroepsactiviteit vallen.
            </p>
            <p className="mt-4">
              Als je als professionele gebruiker of bedrijf handelt, is het herroepingsrecht <strong>niet</strong> van toepassing.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Herroepingstermijn</h2>
            <p>
              Je hebt het recht om binnen <strong>14 dagen</strong> zonder opgave van redenen de overeenkomst te herroepen.
            </p>
            <p className="mt-4">
              De herroepingstermijn verstrijkt 14 dagen na de dag waarop de overeenkomst is gesloten.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Belangrijke Uitzondering: Digitale Diensten</h2>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 my-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Let op:</strong> PenAI levert <strong>digitale diensten</strong> (AI-gegenereerde content) die onmiddellijk
                    worden uitgevoerd en geleverd. In bepaalde gevallen vervalt het herroepingsrecht.
                  </p>
                </div>
              </div>
            </div>

            <p>
              Volgens artikel VI.53, 12° van het Wetboek van Economisch Recht (WER) is het herroepingsrecht <strong>uitgesloten</strong> voor:
            </p>
            <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-700 my-4">
              "De levering van digitale inhoud die niet op een materiële drager is geleverd, indien de uitvoering is begonnen
              met uitdrukkelijke voorafgaande toestemming van de consument en met zijn uitdrukkelijke kennisgeving dat hij daardoor
              zijn herroepingsrecht verliest."
            </blockquote>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Wat betekent dit voor PenAI?</h3>
            <p>
              Wanneer je een e-book of andere content laat genereren bij PenAI:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Wordt de digitale content onmiddellijk gegenereerd en geleverd</li>
              <li>Begin de uitvoering van de dienst direct na je bestelling</li>
              <li>Ontvang je de gegenereerde content zonder materiële drager (als PDF-download)</li>
            </ul>
            <p className="mt-4">
              <strong>Door het plaatsen van je bestelling en het starten van de contentgeneratie, geef je uitdrukkelijk toestemming
              voor de onmiddellijke levering en erken je dat je daardoor je herroepingsrecht verliest.</strong>
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Wanneer vervalt het Herroepingsrecht NIET?</h2>
            <p>
              Het herroepingsrecht blijft behouden als:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Je een bestelling hebt geplaatst maar de uitvoering nog niet is begonnen</li>
              <li>Je alleen een preview hebt bekeken maar de volledige content nog niet hebt ontvangen</li>
              <li>Er een technisch probleem is opgetreden waardoor je de content niet kon ontvangen</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Hoe oefen je het Herroepingsrecht uit?</h2>
            <p>
              Als het herroepingsrecht van toepassing is, kun je dit uitoefenen door ons hiervan op de hoogte te stellen
              via een ondubbelzinnige verklaring, bijvoorbeeld:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Per e-mail naar: <a href="mailto:info@fishdigital.be" className="text-blue-600 hover:underline">info@fishdigital.be</a></li>
              <li>Per post naar: FishDigital BV, Boerenkrijgstraat 10, 2800 Mechelen, België</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Modelformulier Herroeping</h3>
            <p>
              Je kunt gebruik maken van onderstaand modelformulier, maar dit is niet verplicht:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 my-6">
              <p className="text-sm text-gray-700">
                <strong>Aan:</strong> FishDigital BV<br />
                Boerenkrijgstraat 10<br />
                2800 Mechelen, België<br />
                E-mail: info@fishdigital.be<br /><br />

                Ik/Wij (*) deel/delen (*) u hierbij mede dat ik/wij (*) onze overeenkomst betreffende de levering van
                de volgende dienst [beschrijving dienst] herroep/herroepen (*)<br /><br />

                Besteld op (*)/ontvangen op (*): [datum]<br />
                Naam consument(en): [naam]<br />
                Adres consument(en): [adres]<br />
                Handtekening consument(en): [alleen bij papieren kennisgeving]<br />
                Datum: [datum]<br /><br />

                (*) Doorhalen wat niet van toepassing is.
              </p>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Gevolgen van Herroeping</h2>
            <p>
              Als je herroepingsrecht geldig wordt uitgeoefend:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Betalen wij alle van je ontvangen betalingen terug</li>
              <li>Gebeurt de terugbetaling binnen 14 dagen na ontvangst van je herroepingsmelding</li>
              <li>Gebruiken we hetzelfde betaalmiddel als waarmee je de oorspronkelijke betaling hebt verricht, tenzij je uitdrukkelijk akkoord gaat met een ander betaalmiddel</li>
              <li>Brengen we geen kosten in rekening voor deze terugbetaling</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Proportionele Betaling bij Gedeeltelijke Levering</h2>
            <p>
              Als je het herroepingsrecht uitoefent nadat je uitdrukkelijk hebt verzocht dat de levering van de dienst vóór het einde
              van de herroepingstermijn begint, maar de dienst nog niet volledig is voltooid, ben je ons een bedrag verschuldigd dat
              evenredig is aan hetgeen tot het moment waarop je ons van de uitoefening van het herroepingsrecht ten aanzien van deze
              overeenkomst in kennis stelt, is geleverd.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Klachten en Geschillenbeslechting</h2>
            <p>
              Als je het niet eens bent met onze beslissing over een herroepingsverzoek, kun je:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Contact opnemen met onze klantenservice via <a href="mailto:info@fishdigital.be" className="text-blue-600 hover:underline">info@fishdigital.be</a></li>
              <li>Een klacht indienen bij de{' '}
                <a href="https://www.consumentenombudsdienst.be" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Consumentenombudsdienst
                </a>
              </li>
              <li>Gebruik maken van het{' '}
                <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Europees ODR-platform
                </a>
              </li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Contact</h2>
            <p>
              Voor vragen over het herroepingsrecht kun je contact opnemen met:
            </p>
            <p className="mt-2">
              <strong>FishDigital BV</strong><br />
              Boerenkrijgstraat 10<br />
              2800 Mechelen, België<br />
              Ondernemingsnummer: 0635.708.207<br />
              E-mail: <a href="mailto:info@fishdigital.be" className="text-blue-600 hover:underline">info@fishdigital.be</a><br />
              Tel: <a href="tel:+32473471361" className="text-blue-600 hover:underline">+32 473 47 13 61</a>
            </p>

            <div className="bg-green-50 border-l-4 border-green-400 p-4 mt-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    <strong>Consumentenbescherming:</strong> We respecteren je rechten als consument. Bij vragen of problemen
                    staan we altijd klaar om een oplossing te vinden.
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
