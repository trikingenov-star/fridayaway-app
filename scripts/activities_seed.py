# -*- coding: utf-8 -*-
# Seed of the activity database: (code, activity, level 1-3, best period, note, status, source)
# status: "Verificato" only when a source was actually read; everything else is "Da verificare".
ACC="https://all.accor.com/a/en/limitless/thematics/sports-events-activities/europe-best-surf-spots-2025.html"
WIN="https://windy.app/blog/best-kitesurfing-spots-in-europe.html"
LP="https://www.lonelyplanet.com/articles/europes-best-hot-springs"
ALD="https://alertdiver.eu/en_US/blog/7-heavenly-european-dive-destinations/?print=pdf"
PADI="https://travel.padi.com/dive-trip/valencian-community/dive-in-tabarca-island-marine-reserve-15341"
V="Verificato"; D="Da verificare"
R=[]
def a(c,act,l,per,note,st=D,src=""): R.append((c,act,l,per,note,st,src))
# --- SURF
a("BIO","surf",3,"Set–Mar","Mundaka: onda famosa, per surfisti esperti",V,ACC)
a("BOD","surf",2,"Mag–Ott","Lacanau: onde adatte anche ai principianti",V,ACC)
a("FAO","surf",3,"Ott–Apr","Arrifana e costa ovest dell'Algarve, onde quasi tutto l'anno",V,ACC)
for c,l,per,n in [("LIS",3,"Ott–Apr","Spot vicino a Lisbona (Carcavelos, Ericeira, Peniche)"),("OPO",3,"Set–Apr","Spot sulla costa di Porto (Matosinhos, Espinho)"),("FNC",2,"Ott–Mar","Onde grosse sulla costa ovest, per esperti"),("TFS",2,"Ott–Apr","Spot sulla costa sud e nord"),("LPA",3,"Ott–Mar","El Confital e Las Canteras a Las Palmas"),("ACE",3,"Ott–Mar","Famara e La Santa"),("FUE",3,"Ott–Mar","Corralejo ed El Cotillo"),("AHO",2,"Ott–Mar","Porto Ferro, con mareggiate di maestrale")]: a(c,"surf",l,per,n)
# --- KITE & WINDSURF
a("FUE","kite",3,"Tutto l'anno","Sotavento: spot avanzato, vento tutto l'anno",V,WIN)
a("RHO","kite",3,"Mag–Set","Prasonisi: spot avanzato per kite e windsurf",V,WIN)
for c,l,per,n in [("TFS",3,"Mag–Set","El Médano, polo di windsurf e kite"),("LPA",3,"Giu–Set","Pozo Izquierdo, tappa mondiale di windsurf"),("ACE",2,"Mag–Set","Famara e Costa Teguise"),("FAO",2,"Lug–Set","Lagos e Sagres"),("OLB",3,"Apr–Ott","Porto Pollo, polo europeo di windsurf e kite"),("HER",3,"Lug–Set","Kouremenos, a est dell'isola"),("JMK",2,"Lug–Set","Meltemi forte in estate"),("GDN",2,"Mag–Set","Penisola di Hel e baia di Puck")]: a(c,"kite",l,per,n)
# --- DIVE
a("MLA","dive",3,"Apr–Nov","Gozo e Comino, relitti e grotte (a Dwejra controlla le restrizioni)",V,ALD)
a("ALC","dive",2,"Mag–Ott","Riserva marina dell'isola di Tabarca",V,PADI)
for c,l,per,n in [("ACE",3,"Tutto l'anno","Museo Atlántico sommerso a Playa Blanca"),("TFS",2,"Tutto l'anno","Costa sud, fondali vulcanici"),("LPA",2,"Tutto l'anno","Fondali vulcanici"),("FUE",2,"Tutto l'anno","Fondali limpidi e relitti"),("MAH",2,"Mag–Ott","Riserva della biosfera"),("IBZ",2,"Mag–Ott","Prateria di Posidonia (UNESCO) tra Ibiza e Formentera"),("OLB",3,"Mag–Ott","Area marina protetta di Tavolara"),("CAG",2,"Mag–Ott","Riserva di Capo Carbonara"),("MRS",3,"Apr–Ott","Calanques"),("CTA",2,"Mag–Ott","Riviera dei Ciclopi"),("PMO",2,"Mag–Ott","Isola di Ustica"),("BDS",2,"Mag–Ott","Torre Guaceto"),("SUF",2,"Mag–Ott","Costa degli Dei")]: a(c,"dive",l,per,n)
# --- SAIL & BOAT
for c,l,per,n in [("SPU",3,"Mag–Ott","Base per velieri tra le isole dalmate"),("ZAD",3,"Mag–Ott","Vicino alle Kornati"),("DBV",2,"Mag–Ott","Isole Elafiti"),("CFU",3,"Mag–Ott","Ionio, una delle zone più amate per la vela"),("JTR",2,"Mag–Ott","Giro della caldera in barca"),("JMK",2,"Mag–Ott","Barca tra le Cicladi"),("HER",2,"Mag–Ott","Gite in barca"),("RHO",2,"Mag–Ott","Gite in barca"),("PMI",3,"Apr–Ott","Baia di Palma, noleggi e regate"),("IBZ",2,"Mag–Ott","Barca verso Formentera"),("MAH",2,"Mag–Ott","Calette raggiungibili in barca"),("OLB",3,"Mag–Ott","Costa Smeralda e arcipelago della Maddalena"),("CAG",2,"Mag–Ott","Golfo degli Angeli"),("BCN",2,"Apr–Ott","Porto Olimpico, vela urbana"),("VLC",2,"Apr–Ott","Porto dell'America's Cup"),("MLA",2,"Mag–Ott","Gite tra Malta, Gozo e Comino"),("NCE",2,"Mag–Ott","Riviera in barca"),("MRS",2,"Mag–Ott","Barca alle Calanques"),("FAO",3,"Mag–Ott","Gita in barca alle grotte di Benagil"),("STO",2,"Mag–Set","Arcipelago di Stoccolma")]: a(c,"sail",l,per,n)
# --- SKI
for c,l,per,n in [("MUC",3,"Dic–Mar","Alpi bavaresi e tirolesi raggiungibili in giornata"),("VIE",1,"Dic–Mar","Semmering e Alpi Stiriane"),("GRX",3,"Dic–Mar","Sierra Nevada, stazione sciistica molto a sud"),("SOF",3,"Dic–Mar","Vitosha alle porte della città, Borovets e Bansko"),("OTP",2,"Dic–Mar","Sinaia e Poiana Brașov"),("KRK",2,"Dic–Mar","Zakopane e i Tatra"),("OSL",3,"Dic–Mar","Piste in città e Hafjell"),("STO",1,"Dic–Mar","Piccole piste in città"),("REK",2,"Dic–Apr","Bláfjöll vicino alla città"),("RAK",2,"Gen–Mar","Oukaïmeden"),("ZAG",2,"Dic–Mar","Sljeme, la montagna di Zagabria")]: a(c,"ski",l,per,n)
# --- HIKE
for c,l,per,n in [("TFS",3,"Tutto l'anno","Teide e Anaga"),("FNC",3,"Tutto l'anno","Levadas e Pico Ruivo"),("LPA",2,"Tutto l'anno","Roque Nublo"),("JTR",2,"Apr–Ott","Sentiero Fira–Oia"),("HER",2,"Apr–Ott","Gola di Samaria"),("PMI",3,"Ott–Apr","Serra de Tramuntana, patrimonio UNESCO"),("MAH",2,"Ott–Apr","Cami de Cavalls, sentiero costiero"),("REK",3,"Giu–Set","Golden Circle e ghiacciai"),("OSL",2,"Mag–Ott","Fiordo e Nordmarka"),("EDI",3,"Tutto l'anno","Arthur's Seat in città"),("AHO",2,"Ott–Mag","Capo Caccia"),("CTA",3,"Mag–Ott","Etna"),("NAP",3,"Apr–Ott","Vesuvio"),("PMO",2,"Ott–Mag","Riserva dello Zingaro"),("GRX",2,"Mar–Giu","Sierra Nevada e Alpujarras"),("AGP",3,"Tutto l'anno","Caminito del Rey"),("MUC",2,"Mag–Ott","Alpi bavaresi")]: a(c,"hike",l,per,n)
# --- SPA & TERME
a("BUD","spa",3,"Tutto l'anno","Széchenyi: 18 piscine e 10 saune/bagni di vapore",V,LP)
a("REK","spa",3,"Tutto l'anno","Blue Lagoon, a circa 45 minuti dalla città",V,LP)
a("GRX","spa",2,"Tutto l'anno","Hammam Al Ándalus, bagni arabi",V,LP)
for c,l,per,n in [("IST",3,"Tutto l'anno","Hammam storici"),("RAK",3,"Tutto l'anno","Hammam e spa"),("VIE",2,"Tutto l'anno","Therme Wien"),("MUC",2,"Tutto l'anno","Therme Erding"),("NAP",3,"Tutto l'anno","Ischia e le sue terme, in traghetto"),("HEL",3,"Tutto l'anno","Cultura della sauna (Löyly)"),("OSL",2,"Tutto l'anno","Saune sul fiordo")]: a(c,"spa",l,per,n)
# --- WINE
for c,l,per,n in [("BOD",3,"Set–Ott","Saint-Émilion e Médoc"),("LYS",3,"Set–Ott","Beaujolais e Côtes du Rhône"),("OPO",3,"Set–Ott","Valle del Douro e cantine del Porto"),("BIO",3,"Set–Ott","Rioja Alavesa"),("VIE",2,"Set–Nov","Heuriger viennesi"),("CTA",3,"Set–Ott","Vini dell'Etna"),("BDS",2,"Set–Ott","Negroamaro e Primitivo"),("BRI",2,"Set–Ott","Primitivo e Castel del Monte"),("ROM",2,"Set–Ott","Castelli Romani e Frascati")]: a(c,"wine",l,per,n)
# --- GOLF
for c,l,per,n in [("FAO",3,"Tutto l'anno","Algarve, destinazione golf molto famosa"),("AGP",3,"Tutto l'anno","Costa del Sol"),("EDI",3,"Apr–Set","St Andrews, culla del golf"),("PMI",2,"Ott–Apr","Molti campi"),("TFS",2,"Tutto l'anno","Campi sulla costa sud"),("LIS",2,"Tutto l'anno","Cascais ed Estoril"),("DUB",2,"Apr–Set","Campi costieri")]: a(c,"golf",l,per,n)
# --- BIKE
for c,l,per,n in [("AMS",3,"Mar–Ott","Capitale della bici"),("CPH",3,"Mar–Ott","Città a misura di bici"),("PMI",3,"Ott–Apr","Allenamento dei ciclisti professionisti"),("HAM",2,"Mar–Ott","Piste ciclabili lungo l'Elba"),("BER",2,"Mar–Ott","Città piatta e piste ciclabili"),("MUC",2,"Mag–Set","Piste lungo l'Isar")]: a(c,"bike",l,per,n)
# --- NATURE (vulcani, geyser, aurora)
for c,l,per,n in [("CTA",3,"Tutto l'anno","Etna, vulcano attivo"),("NAP",3,"Tutto l'anno","Vesuvio e Campi Flegrei"),("TFS",3,"Tutto l'anno","Teide"),("ACE",3,"Tutto l'anno","Parco di Timanfaya"),("REK",3,"Set–Mar","Geyser, geotermia e aurora boreale"),("JTR",3,"Tutto l'anno","Caldera vulcanica")]: a(c,"nature",l,per,n)
# --- CHRISTMAS MARKETS
for c,l,n in [("VIE",3,""),("PRG",3,""),("BUD",3,""),("MUC",3,""),("BER",2,""),("BRU",2,""),("RIX",3,""),("TLL",3,""),("KRK",3,""),("GDN",3,""),("WAW",2,""),("ZAG",3,"Avvento a Zagabria"),("EDI",3,""),("LON",2,""),("HAM",3,""),("CPH",3,"Tivoli"),("STO",3,"Skansen"),("OSL",2,""),("HEL",2,""),("PAR",2,""),("LYS",3,"Festa delle Luci a dicembre")]: a(c,"xmas",l,"Fine Nov–Dic",n or "Mercatini di Natale")
# --- SHOPPING
for c,l,n in [("LON",3,"Moda e grandi magazzini"),("PAR",3,"Moda e boutique"),("IST",3,"Grand Bazaar"),("RAK",3,"Souk"),("MAD",2,""),("BCN",2,""),("BER",2,""),("VIE",2,""),("MUC",2,""),("AMS",2,""),("CPH",2,"")]: a(c,"shop",l,"Tutto l'anno",n or "Shopping")
# --- FOOTBALL
for c,l,n in [("BCN",3,"Camp Nou e derby"),("MAD",3,"Bernabéu e Metropolitano"),("MUC",3,"Allianz Arena"),("LON",3,"Molti stadi"),("ROM",3,"Olimpico"),("NAP",3,"Stadio Maradona"),("IST",3,"Derby di Istanbul"),("BEG",3,"Derby eterno"),("LIS",2,"Benfica e Sporting"),("OPO",2,"Porto e Boavista"),("AMS",2,"Ajax"),("VLC",2,"Mestalla"),("SVQ",2,"Derby andaluso"),("BIO",2,"San Mamés"),("ATH",2,"Panathinaikos e Olympiacos")]: a(c,"foot",l,"Set–Mag",n)
ACTS=[ # key, IT, EN, ES, emoji, keywords
("surf","Surf","Surfing","Surf","🏄","surf,surfare,onde,tavola,wave,waves,surfing"),
("kite","Kite & windsurf","Kite & windsurf","Kite y windsurf","🪁","kite,kitesurf,windsurf,vento,wind,wing"),
("dive","Immersioni","Diving","Buceo","🤿","immersioni,immersione,diving,snorkeling,snorkel,sub,subacquea,buceo"),
("sail","Barca & vela","Boats & sailing","Barco y vela","⛵","barca,vela,sailing,boat,yacht,catamarano,crociera,veliero,gita in barca"),
("ski","Sci & neve","Ski & snow","Esquí y nieve","⛷️","sci,snowboard,neve,ski,snow,piste,montagna"),
("hike","Trekking","Hiking","Senderismo","🥾","trekking,hiking,escursioni,escursione,sentieri,camminata,montagna,senderismo"),
("spa","Terme & spa","Spas & baths","Termas y spa","♨️","terme,spa,benessere,thermal,sauna,hammam,massaggi,relax"),
("wine","Vino","Wine","Vino","🍷","vino,wine,cantine,degustazione,vigneti,enoteca"),
("golf","Golf","Golf","Golf","⛳","golf"),
("bike","Bici","Cycling","Bici","🚴","bici,bike,cycling,ciclismo,pedalare"),
("nature","Vulcani & natura","Volcanoes & nature","Volcanes y naturaleza","🌋","vulcano,vulcani,geyser,aurora,natura,paesaggi,lago,volcano"),
("xmas","Mercatini di Natale","Christmas markets","Mercadillos de Navidad","🎄","natale,mercatini,christmas,navidad,avvento"),
("shop","Shopping","Shopping","Compras","🛍️","shopping,negozi,moda,compere,saldi"),
("foot","Calcio","Football","Fútbol","⚽","calcio,stadio,partita,football,soccer,fútbol")]
