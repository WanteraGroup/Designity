export interface DesignlyTemplate {
  id: string;
  name: string;
  category: string;
  type: string;
  premium: boolean;
  description: string;
  style: string;
  palette: string[];
  layout: 'editorial' | 'bold' | 'minimal' | 'luxury' | 'corporate';
}

export const DESIGNLY_TEMPLATES: DesignlyTemplate[] = [
  { id:'nordic-luxury', name:'Nordic Luxury', category:'Business', type:'brand', premium:true, description:'Sötét, arany, prémium márkaidentitás.', style:'luxury', palette:['#0b0b0b','#c9a45c','#f1e8d5'], layout:'luxury' },
  { id:'celtic-brand', name:'Celtic Heritage', category:'Corporate', type:'brand', premium:true, description:'Kelta ornamentika modern üzleti arculattal.', style:'cinematic', palette:['#101010','#b99045','#d9c7a0'], layout:'luxury' },
  { id:'premium-barber', name:'Premium Barber', category:'Beauty', type:'poster', premium:true, description:'Elegáns barber kampány sötét tónusokkal.', style:'bold', palette:['#111111','#d4af63','#ffffff'], layout:'bold' },
  { id:'fine-dining', name:'Fine Dining', category:'Restaurant', type:'menu', premium:true, description:'Prémium éttermi menü és vizuális rendszer.', style:'elegant', palette:['#0c0c0c','#c6a15b','#eee7d8'], layout:'editorial' },
  { id:'modern-clinic', name:'Modern Clinic', category:'Business', type:'landing', premium:false, description:'Tiszta, bizalomépítő klinikai landing page.', style:'modern', palette:['#f5f3ee','#18201f','#a88b54'], layout:'minimal' },
  { id:'elite-fitness', name:'Elite Fitness', category:'Fitness', type:'social', premium:true, description:'Erős, kontrasztos edzőtermi social kampány.', style:'bold', palette:['#0a0a0a','#d0a85c','#f6f6f6'], layout:'bold' },
  { id:'tech-startup', name:'Tech Startup', category:'Technology', type:'website', premium:false, description:'Modern startup weboldal fókuszált CTA-val.', style:'technology', palette:['#090909','#c7a15a','#e8e8e8'], layout:'minimal' },
  { id:'real-estate', name:'Premium Real Estate', category:'Real Estate', type:'brochure', premium:true, description:'Ingatlanmarketing luxus szerkesztőségi megjelenéssel.', style:'real_estate', palette:['#121212','#b79557','#f0ece3'], layout:'editorial' },
  { id:'wedding-classic', name:'Wedding Classic', category:'Wedding', type:'invitation', premium:true, description:'Időtálló esküvői meghívó elegáns tipográfiával.', style:'elegant', palette:['#f4efe6','#8f7042','#24211d'], layout:'editorial' },
  { id:'event-promo', name:'Event Promo', category:'Events', type:'poster', premium:false, description:'Látványos eseményplakát erős hierarchiával.', style:'bold', palette:['#101010','#d1a75e','#f7f2e8'], layout:'bold' },
  { id:'boutique-store', name:'Boutique Store', category:'E-commerce', type:'social', premium:false, description:'Divatos boutique social és promóciós rendszer.', style:'fashion', palette:['#111111','#caa66a','#eee8dc'], layout:'minimal' },
  { id:'corporate-pro', name:'Corporate Pro', category:'Corporate', type:'presentation', premium:true, description:'Vállalati prezentáció egységes arculati rendszerrel.', style:'corporate', palette:['#101010','#b89960','#ffffff'], layout:'corporate' },
  { id:'marketing-agency', name:'Marketing Agency', category:'Marketing', type:'campaign', premium:true, description:'Teljes kampánycsomag több formátumra.', style:'creative', palette:['#0b0b0b','#d0a45b','#f2eee6'], layout:'bold' },
  { id:'portfolio-editorial', name:'Editorial Portfolio', category:'Personal', type:'website', premium:false, description:'Minimalista személyes portfólió prémium szerkesztőségi érzettel.', style:'minimal', palette:['#f2efe9','#171717','#a9854e'], layout:'editorial' },
  { id:'digital-card', name:'Digital Executive Card', category:'Business', type:'business_card', premium:true, description:'Prémium digitális névjegykártya.', style:'premium', palette:['#080808','#d1ab68','#efe7d8'], layout:'luxury' },
  { id:'price-list', name:'Luxury Price List', category:'Beauty', type:'pricelist', premium:true, description:'Árlista kozmetikai és prémium szolgáltatásokhoz.', style:'luxury', palette:['#0c0c0c','#c5a064','#f1eadf'], layout:'editorial' },
  { id:'restaurant-social', name:'Restaurant Social', category:'Restaurant', type:'social', premium:false, description:'Éttermi social poszt modern étvágygerjesztő struktúrával.', style:'restaurant', palette:['#111111','#c49a55','#f3ead9'], layout:'bold' },
  { id:'agency-flyer', name:'Agency Flyer', category:'Marketing', type:'flyer', premium:false, description:'Ügynökségi ajánlat vagy szolgáltatás flyer.', style:'creative', palette:['#0b0b0b','#caa15b','#faf7ef'], layout:'bold' },
  { id:'norse-launch', name:'Norse Launch', category:'Technology', type:'landing', premium:true, description:'DESIGNLY-hangulatú filmes termékbevezető landing.', style:'cinematic', palette:['#070707','#d1a75f','#e8dfcf'], layout:'luxury' },
  { id:'brand-kit-core', name:'Brand Kit Core', category:'Corporate', type:'brand', premium:true, description:'Logó, színek, tipográfia és vizuális szabályok.', style:'premium', palette:['#0a0a0a','#c7a15b','#f4eee2'], layout:'corporate' },
  { id:'social-story', name:'Premium Story', category:'Marketing', type:'social', premium:false, description:'Vertikális social story gyors kampányokhoz.', style:'premium', palette:['#0b0b0b','#d3aa62','#f7f2e8'], layout:'bold' },
  { id:'business-invitation', name:'Executive Invitation', category:'Business', type:'invitation', premium:true, description:'Üzleti események és VIP meghívók.', style:'elegant', palette:['#0d0d0d','#c6a15e','#eee7da'], layout:'editorial' },
];