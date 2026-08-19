import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8 lg:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Algemene Voorwaarden – PenAI.be</h1>
          <p className="text-sm text-gray-600 mb-8">Laatst bijgewerkt: <strong>04/12/2025</strong></p>

          <div className="prose prose-gray max-w-none">
            <p>
              Welkom bij <strong>PenAI.be</strong>, een online vertaalservice die gebruikmaakt van artificiële intelligentie.
              Door gebruik te maken van de website en diensten van PenAI (hierna <strong>"PenAI"</strong>, <strong>"wij"</strong>,
              <strong>"ons"</strong> of <strong>"onze"</strong>), ga je akkoord met deze Algemene Voorwaarden.
            </p>
            <p>
              Indien je niet akkoord gaat met deze voorwaarden, maak dan geen gebruik van onze diensten.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Definities</h2>
            <p><strong>Website:</strong> de website bereikbaar via <a href="https://www.penai.be" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.penai.be</a>.</p>
            <p><strong>Diensten:</strong> alle diensten geleverd door PenAI, waaronder (maar niet beperkt tot) AI-gestuurde vertalingen, tekstanalyse, contentcreatie en gerelateerde functionaliteiten.</p>
            <p><strong>Gebruiker:</strong> iedere natuurlijke persoon of rechtspersoon die de Website bezoekt of gebruik maakt van de Diensten.</p>
            <p><strong>Content:</strong> alle teksten, gegevens, documenten of ander materiaal dat door de Gebruiker wordt geüpload, ingevoerd of verstuurd via de Website.</p>
            <p><strong>Output:</strong> alle resultaten die PenAI genereert op basis van de door de Gebruiker verstrekte Content.</p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Toepasselijkheid</h2>
            <p>
              Deze Algemene Voorwaarden zijn van toepassing op elk bezoek aan de Website en ieder gebruik van de Diensten van PenAI.
              PenAI behoudt zich het recht voor om deze voorwaarden op elk moment te wijzigen. De meest recente versie wordt steeds op de Website gepubliceerd.
              Verdere toegang tot of gebruik van de Website en Diensten na wijziging impliceert aanvaarding van de gewijzigde voorwaarden.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Dienstverlening</h2>
            <p>1. PenAI biedt een online dienst aan waarbij AI-technologie wordt gebruikt voor vertalingen en aanverwante tekstdiensten.</p>
            <p>2. De Gebruiker erkent en begrijpt dat:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>de Output automatisch wordt gegenereerd door AI-modellen,</li>
              <li>vertalingen en andere Output niet noodzakelijk volledig foutloos, volledig of contextueel correct zijn,</li>
              <li>menselijke review altijd aanbevolen is, zeker bij juridische, technische, financiële of andere kritische documenten.</li>
            </ul>
            <p>
              3. PenAI geeft geen garantie op de resultaten, nauwkeurigheid of geschiktheid van de Output voor een specifiek doel.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Gebruik van de Diensten</h2>
            <p>De Gebruiker verbindt zich ertoe om:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>geen onwettelijke, beledigende, discriminerende of schadelijke Content te uploaden;</li>
              <li>geen Content te uploaden die inbreuk maakt op intellectuele eigendomsrechten van derden (bv. auteursrecht, merkenrecht);</li>
              <li>geen persoonsgegevens of vertrouwelijke gegevens te uploaden zonder de vereiste wettelijke basis of toestemming;</li>
              <li>de Website of Diensten niet te gebruiken op een wijze die de goede werking kan verstoren (zoals misbruik, overbelasting, hacking, scraping, …).</li>
            </ul>
            <p>
              PenAI behoudt zich het recht voor om het gebruik van de Diensten te beperken, op te schorten of te beëindigen wanneer er sprake is van misbruik of schending van deze Algemene Voorwaarden.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Intellectuele Eigendom</h2>
            <p>
              1. <strong>Content van de Gebruiker:</strong> de Gebruiker behoudt alle rechten (zoals auteursrecht) op de eigen aangeleverde Content.
              De Gebruiker verleent PenAI een niet-exclusieve, wereldwijde licentie om deze Content te gebruiken voor:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>het leveren van de Diensten;</li>
              <li>technische opslag en back-up;</li>
              <li>verbetering en optimalisatie van de werking van de Dienst, in geanonimiseerde of geaggregeerde vorm.</li>
            </ul>
            <p>
              2. <strong>Output:</strong> Voor zover toegestaan door de toepasselijke wetgeving verkrijgt de Gebruiker de rechten op de gegenereerde Output.
              De Gebruiker is zelf verantwoordelijk voor het gebruik van die Output en voor eventuele verdere publicatie of verspreiding ervan.
            </p>
            <p>
              3. <strong>Rechten van PenAI:</strong> alle intellectuele eigendomsrechten op de Website, de onderliggende software, AI-modellen,
              logo's, merken en alle andere materialen van PenAI blijven eigendom van PenAI en/of haar licentiegevers.
              Niets in deze voorwaarden impliceert een overdracht van dergelijke rechten aan de Gebruiker.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Vertrouwelijkheid & Privacy</h2>
            <p>
              1. PenAI verwerkt persoonsgegevens in overeenstemming met de geldende privacywetgeving (waaronder de GDPR).
              Meer informatie hierover vind je in onze aparte privacyverklaring (Privacy Policy).
            </p>
            <p>
              2. De Gebruiker is zelf verantwoordelijk om geen persoonsgegevens, vertrouwelijke bedrijfsinformatie of andere gevoelige data aan te leveren
              zonder de nodige toestemming of wettelijke grondslag.
            </p>
            <p>
              3. PenAI bewaart Content en Output enkel voor zover nodig voor:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>de correcte levering van de Diensten,</li>
              <li>kwaliteitsbewaking en verbetering van de service,</li>
              <li>technische ondersteuning en foutopsporing,</li>
              <li>naleving van wettelijke verplichtingen.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Disclaimers</h2>
            <p>
              1. De Diensten worden aangeboden op een "as is" en "as available" basis. PenAI geeft geen expliciete of impliciete garanties,
              waaronder (maar niet beperkt tot) garanties over nauwkeurigheid, volledigheid, geschiktheid voor een bepaald doel of niet-inbreuk.
            </p>
            <p>
              2. PenAI garandeert niet dat:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>de Diensten ononderbroken, veilig of foutloos zullen zijn;</li>
              <li>eventuele fouten in de Output of software steeds (tijdig) zullen worden gecorrigeerd;</li>
              <li>de resultaten van het gebruik van de Diensten aan de verwachtingen van de Gebruiker zullen voldoen.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Aansprakelijkheid</h2>
            <p>
              1. PenAI is niet aansprakelijk voor enige directe of indirecte schade die voortvloeit uit:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>het gebruik of de onmogelijkheid tot gebruik van de Website of Diensten;</li>
              <li>fouten, onnauwkeurigheden of onvolledigheden in de Output;</li>
              <li>verlies of corruptie van gegevens;</li>
              <li>elke beslissing of handeling die de Gebruiker neemt op basis van de Output.</li>
            </ul>
            <p>
              2. In de mate dat enige aansprakelijkheid van PenAI toch zou worden vastgesteld, is die aansprakelijkheid beperkt tot
              het bedrag dat de Gebruiker voor de betreffende Dienst aan PenAI heeft betaald in de twaalf (12) maanden voorafgaand aan het schadegeval.
              Bij gratis gebruik is de aansprakelijkheid van PenAI, voor zover wettelijk toegestaan, volledig uitgesloten.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Betalingen & Facturatie</h2>
            <p>
              1. Indien en voor zover PenAI betalende formules of diensten aanbiedt, worden de toepasselijke prijzen vermeld op de Website
              of in een afzonderlijke offerte.
            </p>
            <p>
              2. Betaling gebeurt via de betaalmethodes die op de Website worden aangeboden. De Gebruiker verbindt zich ertoe juiste facturatiegegevens te verstrekken.
            </p>
            <p>
              3. Facturen worden in principe digitaal bezorgd aan het door de Gebruiker opgegeven e-mailadres.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Annulatie & Terugbetalingen</h2>
            <p>
              Aangezien de Diensten van PenAI bestaan uit digitale, AI-gegenereerde Output die onmiddellijk geleverd kan worden,
              is er in principe geen recht op annulatie of terugbetaling nadat de Output werd gegenereerd,
              tenzij anders overeengekomen of wettelijk verplicht.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Beschikbaarheid van de Dienst</h2>
            <p>
              PenAI streeft ernaar om de Website en Diensten zo veel mogelijk beschikbaar te houden, maar kan geen garantie geven op ononderbroken beschikbaarheid.
              Onderhoudswerkzaamheden, updates of overmachtssituaties kunnen ertoe leiden dat de Diensten tijdelijk niet beschikbaar zijn.
              PenAI kan hiervoor niet aansprakelijk worden gesteld.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Externe Tools & Derde Partijen</h2>
            <p>
              1. PenAI maakt gebruik van externe AI-modellen en technologieën van derde partijen (bijvoorbeeld aanbieders van cloud- of AI-diensten).
              Het gebruik van de Diensten impliceert dat je ook akkoord gaat met de toepasselijke voorwaarden van deze derde partijen,
              voor zover ze relevant zijn voor het gebruik van de Dienst.
            </p>
            <p>
              2. PenAI is niet verantwoordelijk voor de diensten, voorwaarden of het privacybeleid van deze derde partijen.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">13. Toepasselijk Recht & Bevoegde Rechtbank</h2>
            <p>
              Op deze Algemene Voorwaarden is uitsluitend het <strong>Belgisch recht</strong> van toepassing.
              In geval van geschillen zijn uitsluitend de rechtbanken van het gerechtelijk arrondissement waar PenAI haar maatschappelijke zetel heeft bevoegd,
              tenzij dwingend recht anders voorschrijft.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">14. Contact</h2>
            <p>
              Voor vragen, opmerkingen of klachten kan je contact opnemen met:
            </p>
            <p>
              <strong>FishDigital BV</strong><br />
              Boerenkrijgstraat 10<br />
              2800 Mechelen, België<br />
              Website: <a href="https://www.penai.be" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.penai.be</a><br />
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
