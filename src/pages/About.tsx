import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { Brain, Code, Sparkles, User, ExternalLink } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Over PenAI.be
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Waar menselijke visie en kunstmatige intelligentie samenkomen
          </p>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-blue-50 rounded-xl">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Het Geesteskind</h2>
                <p className="text-gray-600 leading-relaxed">
                  PenAI.be is het geesteskind van <a
                    href="https://www.linkedin.com/in/steingullentops/?locale=en"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 transition-colors"
                  >
                    Stein Gullentops
                    <ExternalLink className="w-4 h-4" />
                  </a>, een visionaire ondernemer die de kracht van AI wilde inzetten om content creatie toegankelijk te maken voor iedereen.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-green-50 rounded-xl">
                <Brain className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Volledig AI-Gedreven</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Wat deze website uniek maakt, is dat alles na het initiële concept volledig door kunstmatige intelligentie gebouwd en geschreven werd. Van de code tot de content, van het design tot de functionaliteit - elke regel code, elke tekst, en elk algoritme is het resultaat van geavanceerde AI-technologie.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Dit is niet alleen een platform dat AI gebruikt, maar een platform dat door AI is gecreëerd. Een levend bewijs van wat moderne AI-technologie kan bereiken wanneer het wordt aangestuurd door een duidelijke visie.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-orange-50 rounded-xl">
                <Code className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">De Technologie</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  PenAI.be maakt gebruik van state-of-the-art AI-modellen voor natuurlijke taalverwerking, waaronder Claude (Anthropic) en andere toonaangevende large language models. Deze krachtige technologieën stellen ons in staat om:
                </p>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Hoogwaardige content te genereren in verschillende formats en stijlen</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Content strategieën te ontwikkelen op maat van jouw doelgroep</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Bestaande content slim te hergebruiken voor verschillende kanalen</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Trending topics en relevante content ideeën te identificeren</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border-2 border-blue-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Onze Missie</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We geloven dat krachtige content creatie tools niet voorbehouden moeten blijven voor grote bedrijven met grote budgetten. Door de kracht van AI in te zetten, maken we professionele content creatie toegankelijk voor ondernemers, marketeers, en content creators van alle formaten.
            </p>
            <p className="text-gray-700 leading-relaxed">
              PenAI.be is een platform waar technologie ten dienste staat van creativiteit, waar AI menselijke creativiteit versterkt in plaats van vervangt, en waar iedereen de tools krijgt om hun verhaal op de beste manier te vertellen.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Transparantie & Ethiek</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We zijn transparant over het gebruik van AI in ons platform. Alle content die door onze tools wordt gegenereerd, wordt gecreëerd door geavanceerde AI-modellen. We moedigen gebruikers aan om deze content te reviewen, te personaliseren en aan te passen aan hun specifieke behoeften.
            </p>
            <p className="text-gray-600 leading-relaxed">
              AI is een krachtig hulpmiddel, maar de menselijke touch blijft essentieel. Gebruik onze tools als uitgangspunt en voeg je eigen expertise, perspectief en persoonlijkheid toe om echt unieke content te creëren.
            </p>
          </div>

          <div className="bg-gray-900 text-white rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Klaar om te beginnen?</h2>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Ontdek hoe PenAI.be jouw content creatie kan transformeren. Van blog posts tot complete content strategieën, we helpen je om meer te bereiken met minder inspanning.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/generator"
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg inline-flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Start nu gratis
              </a>
              <a
                href="/pricing"
                className="px-8 py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-all shadow-lg inline-flex items-center justify-center"
              >
                Bekijk prijzen
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
