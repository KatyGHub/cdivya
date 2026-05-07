/**
 * wordle.js — DIVYADLE ∞
 * Endless play · 8 categories · 400+ words · levels · streaks
 * No daily limit. Play again instantly. Pick a category or go random.
 */

// ─── Word Bank ─────────────────────────────────────────────────────────────────
// Format: [WORD, flavour text]
const BANK = {

  design: [
    ['BOKEH','Those dreamy blurred backgrounds. She makes them look effortless.'],
    ['SERIF','The little feet on letters. Cormorant Garamond has them. She notices.'],
    ['GLYPH','A single character form — the atom of written language.'],
    ['BLEED','Artwork that extends to the very edge of the page. Intentional.'],
    ['MOTIF','A recurring visual element that builds meaning across a system.'],
    ['GRAIN','The texture that makes a photo feel lived-in rather than sterile.'],
    ['LAYER','How she builds — one decision at a time, always reversible.'],
    ['SCALE','The size relationship between elements. She always gets this right.'],
    ['ALIGN','The invisible grid holding everything together. Her instinct.'],
    ['FRAME','What you include — and exclude — is the whole art.'],
    ['TONAL','Related to the full range of values from light to dark.'],
    ['OCHRE','The warm earthy yellow-orange. Used with restraint. Devastatingly well.'],
    ['SEPIA','The warm tone of aged photographs. Timeless on purpose.'],
    ['MUTED','Desaturated. Quieter. Still saying everything.'],
    ['VIVID','When she wants you to feel it before you understand it.'],
    ['AMBER','Warm. Golden. The light at 5pm that she always shoots in.'],
    ['IVORY','Not white. Warmer than white. The difference matters enormously.'],
    ['CORAL','The colour between orange and pink. Perpetually in season.'],
    ['SLATE','Cool grey with a blue undertone. A sophisticated neutral.'],
    ['PROOF','The final check before committing. She never skips this.'],
    ['STOCK','The paper itself. She has strong opinions about this.'],
    ['PRIME','A fixed focal length lens. She probably owns three.'],
    ['DODGE','To selectively lighten an area. Old darkroom technique.'],
    ['GLOSS','High shine paper stock. The opposite of her usual matte preference.'],
    ['MATTE','Flat, non-reflective. Her preferred surface for print. Always.'],
    ['FLARE','When the light source bleeds into the lens. Intentional. Always.'],
    ['DEPTH','The illusion that a flat image has distance. She engineers it.'],
    ['CRISP','Clean edges. No softness. When precision is the whole point.'],
    ['STARK','Bare. Stripped back. When negative space does the heavy lifting.'],
    ['DRAFT','Version one is permission to make version two better.'],
    ['BLEND','Where two things become one. She does this with ideas too.'],
    ['CRAFT','The thing you cannot fake. Time plus attention. She has both.'],
    ['TRACE','The first step in understanding a form is to redraw it.'],
    ['PIXEL','The smallest unit of a digital image. She has thought about this.'],
    ['BRUSH','Digital or physical, she handles both with equal precision.'],
    ['PRINT','When the digital becomes physical. The moment of truth.'],
    ['SHARP','The first thing she checks. Always. Before anything else.'],
    ['GLARE','The enemy of outdoor portraits. She fixes it in post anyway.'],
    ['TRACK','Uniform letter-spacing applied across a range of characters.'],
    ['SPINE','The curved stroke in the letter S. Yes, letters have anatomy.'],
    ['SWIPE','Moving quickly through design options. Her scroll speed is legendary.'],
    ['FOCUS','Where the eye goes first. She controls this completely.'],
    ['SHOOT','The moment before the moment. She lives here.'],
    ['COLOR','The most subjective element. She is never wrong about it.'],
    ['STYLE','More than aesthetic — it is a language she speaks fluently.'],
    ['BRAND','The promise a business makes. She builds it from zero.'],
    ['PATCH','Small correction. Big difference. She knows which is which.'],
    ['SPACE','Negative space is not nothing. It is the most deliberate choice.'],
    ['CURVE','The stroke direction in letterforms. Decisive. Never accidental.'],
    ['SHAPE','Before colour, before type — there is always a shape.'],
  ],

  geography: [
    ['JAPAN','The archipelago of 6,852 islands. Cherry blossoms. Bullet trains.'],
    ['KENYA','East African nation on the equator. The Great Rift Valley runs through it.'],
    ['CHILE','The world longest country — 4,300km north to south.'],
    ['SPAIN','Where flamenco, Gaudi, and La Tomatina coexist without explanation.'],
    ['GHANA','West African nation. First sub-Saharan country to gain independence in 1957.'],
    ['NEPAL','Home to eight of the world ten tallest mountains, including Everest.'],
    ['QATAR','The world wealthiest country per capita. Juts into the Persian Gulf.'],
    ['WALES','The land of dragons, coal, and an almost unpronounceable language.'],
    ['ANDES','The world longest continental mountain range — 7,000km through South America.'],
    ['SAHEL','The semi-arid zone south of the Sahara. Spanning 11 countries.'],
    ['FJORD','A long, narrow inlet carved by glaciers. Norway signature feature.'],
    ['DELTA','A landform where a river deposits sediment as it meets the sea.'],
    ['OASIS','A fertile spot in a desert, fed by underground water.'],
    ['ATOLL','A ring-shaped coral reef enclosing a lagoon. The Maldives is mostly these.'],
    ['CAIRO','Africa largest city. The Great Pyramid sits on its outskirts.'],
    ['ACCRA','Capital of Ghana. Sits right on the Greenwich Meridian.'],
    ['TUNIS','Capital of Tunisia. Founded by the Berbers, later Rome rival.'],
    ['HANOI','Capital of Vietnam. One thousand years of history in one city.'],
    ['DOVER','Famous for its white cliffs. The closest point between England and France.'],
    ['KABUL','Capital of Afghanistan. One of the world oldest cities.'],
    ['NIGER','Largest country in West Africa by area. Mostly Sahara desert.'],
    ['LIEGE','A city in Belgium, also a feudal term for lord. Two meanings, one spelling.'],
    ['HAGUE','City in Netherlands. Home to the International Court of Justice.'],
    ['BASEL','Swiss city on the Rhine. Known for art, banking, and pharmaceuticals.'],
    ['BRUGES','Medieval Belgian city. Canals and chocolates. Belgium at its most Belgian.'],
    ['ALGAE','Found in every body of water on Earth. Not a place but feels like one.'],
    ['PLAINS','Flat, treeless grassland. Eurasia has the world largest steppe.'],
    ['KAREN','A district in Nairobi, Kenya. Named after Karen Blixen of Out of Africa.'],
    ['GABON','Central African nation on the equator. 80 percent covered by rainforest.'],
    ['PALAU','A Pacific island nation. Has one of the world most protected marine areas.'],
    ['BENIN','West African nation. Do not confuse with the ancient Benin Kingdom.'],
    ['TONGA','Polynesian kingdom in the South Pacific. The only remaining Pacific monarchy.'],
    ['LATHE','A machine tool. Also: Lathe, a geographic administrative division in Kent.'],
    ['URALS','The mountain range that forms the boundary between Europe and Asia.'],
    ['BASIN','A geographic depression that collects water. The Amazon Basin is the largest.'],
    ['RIDGE','A long, narrow elevated strip of land. Mid-ocean ridges form new seafloor.'],
    ['STOKE','A city in England. Stoke-on-Trent. The pottery capital of Britain.'],
    ['FLINT','A city in Michigan, USA. Famous for its water crisis starting in 2014.'],
    ['OCEAN','The largest ecosystem on Earth covers 71 percent of its surface.'],
    ['POLAR','Relating to the regions around the North or South Pole.'],
    ['REEFS','Structures built by coral organisms over thousands of years.'],
    ['TIDAL','Relating to the periodic rise and fall of sea levels.'],
    ['BLUFF','A steep cliff or headland. Also: Bluff, a town at the southern tip of NZ.'],
    ['CREEK','A small stream or waterway. In Australia, can mean a large river.'],
  ],

  science: [
    ['QUARK','The fundamental particle that makes up protons and neutrons.'],
    ['PLASMA','The fourth state of matter. Lightning is plasma.'],
    ['ORBIT','The curved path of an object around a star or planet.'],
    ['XENON','A noble gas used in flash lamps and some anaesthetics.'],
    ['ALGAE','Photosynthetic organisms that produce 50 percent of Earth oxygen.'],
    ['PRISM','A transparent object that refracts white light into its spectrum.'],
    ['ALLOY','A mixture of two or more metals. Bronze, steel, brass.'],
    ['FUNGI','The kingdom between plants and animals. Mushrooms. Yeast. Penicillin.'],
    ['NERVE','A bundle of fibres that transmits signals between brain and body.'],
    ['MAGMA','Molten rock beneath the Earth surface. Called lava above ground.'],
    ['OZONE','A molecule of three oxygen atoms. Earth UV shield.'],
    ['INERT','Chemically unreactive. The noble gases are all inert.'],
    ['HELIX','A spiral structure. DNA is a double one.'],
    ['IONIC','A type of chemical bond formed by transferring electrons.'],
    ['LUNAR','Relating to the moon. The cycle is 29.5 days.'],
    ['SOLAR','Relating to the sun. The source of almost all energy on Earth.'],
    ['FETUS','An unborn offspring after the embryonic stage.'],
    ['SPORE','A reproductive unit of fungi, plants, and bacteria.'],
    ['VENOM','A toxic secretion delivered by bite or sting. Not the same as poison.'],
    ['GAUGE','An instrument for measuring. Also the width of a railway track.'],
    ['COMET','A small icy body that develops a tail when near the sun.'],
    ['CLONE','A genetically identical copy. Dolly the sheep was the first mammal.'],
    ['DWARF','In astronomy, a small star or planet. The sun is a yellow dwarf.'],
    ['ETHOS','Not strictly science, but Thomas Kuhn used it about scientific culture.'],
    ['AXION','A hypothetical subatomic particle — a dark matter candidate.'],
    ['VIRUS','A submicroscopic infectious agent. Not alive. Not dead. Complicated.'],
    ['TOXIC','Poisonous. From the Greek toxikon, meaning arrow poison.'],
    ['VAPOR','Gas formed from a substance below its boiling point. Like steam.'],
    ['RATIO','The quantitative relationship between two amounts. Pure mathematics.'],
    ['CYCLE','A series of events repeated in the same order. Carbon cycle. Water cycle.'],
    ['TRAIT','A genetically determined characteristic passed from parent to offspring.'],
    ['DECAY','The process of radioactive atoms losing energy over time.'],
    ['BRAIN','The organ that processes everything. Still not fully understood.'],
    ['PULSE','The rhythmic beating of the heart, detectable at the wrist.'],
    ['FLORA','The plants of a particular region, habitat, or geological period.'],
    ['FAUNA','The animals of a particular region or time.'],
    ['SOLAR','Energy from the sun, increasingly powering human civilisation.'],
    ['RENAL','Relating to the kidneys. Renal failure is serious. Stay hydrated.'],
    ['OPTIC','Relating to the eye or vision. The optic nerve carries sight signals.'],
    ['METAL','An element that conducts electricity and heat. Most elements are metals.'],
    ['AMINO','As in amino acid — the building blocks of protein.'],
    ['SYRUP','A thick sweet liquid. In pharmacology, used as a medicine base.'],
    ['TABBY','A cat coat pattern. Also a type of concrete made from oyster shells.'],
    ['DRILL','A tool for making holes. Also a training exercise. Both create precision.'],
    ['LIVER','The largest internal organ. Performs over 500 known functions.'],
  ],

  history: [
    ['ROMAN','Relating to the civilisation that gave us laws, roads, and concrete.'],
    ['MOGUL','The dynasty that ruled the Indian subcontinent for 300 years.'],
    ['TUDOR','The English royal dynasty that included Henry VIII and Elizabeth I.'],
    ['GULAG','The Soviet system of forced labour camps. Solzhenitsyn wrote about them.'],
    ['STOIC','A school of philosophy founded in Athens around 300 BC.'],
    ['PLATO','Athenian philosopher. Student of Socrates, teacher of Aristotle.'],
    ['OPIUM','The trade that sparked two wars between Britain and China in the 1800s.'],
    ['ALAMO','The 1836 battle in Texas. Remember the Alamo.'],
    ['VICHY','The French government that collaborated with Nazi Germany 1940 to 44.'],
    ['MOORS','North African Muslim inhabitants of the Iberian Peninsula 711 to 1492.'],
    ['FEUDAL','The system of land ownership that defined medieval Europe.'],
    ['EDICT','An official proclamation issued by a person in authority.'],
    ['SIEGE','A military strategy of surrounding and starving out a fortification.'],
    ['TRUCE','A temporary agreement to stop fighting. Often violated shortly after.'],
    ['REALM','A kingdom or domain. In the realm of kings.'],
    ['ENVOY','A diplomatic representative sent to a foreign country.'],
    ['PAGAN','A follower of a pre-Christian or non-Abrahamic religion.'],
    ['RELIC','An object from the past that has survived. Sacred or historical.'],
    ['ANNEX','To incorporate territory into a country or state.'],
    ['LIEGE','A feudal lord to whom loyalty was owed.'],
    ['SERF', 'A medieval agricultural labourer bound to the lord land.'],
    ['EXILE','Forced removal from ones country. Used to neutralise opponents.'],
    ['FORGE','To make or shape metal by heating and hammering. Or to fake a document.'],
    ['GUILD','A medieval association of craftsmen or merchants.'],
    ['MARCH','A borderland territory. Also the act of walking in formation.'],
    ['PAPAL','Relating to the Pope and the Roman Catholic Church.'],
    ['REIGN','The period during which a monarch rules. Not rain. Not rein.'],
    ['CASTE','A hereditary social class system. Still influential in parts of South Asia.'],
    ['PURGE','The removal of opponents from a political party or government.'],
    ['SCOUT','A soldier sent ahead to gather information on the enemy.'],
    ['SHIRE','An English county. Also a region in Middle-earth, inspiration from real places.'],
    ['TRIBE','A social division in a traditional society. Led by a chief or elder.'],
    ['ALTAR','A table used for religious offerings. Found in temples worldwide.'],
    ['DIVAN','A council of state in Ottoman Turkey. Also a type of sofa. Same word.'],
    ['FORTS','Military fortifications. Built to protect, often became towns.'],
    ['GRIOT','A West African oral historian, storyteller, and musician.'],
    ['JANISSARY','Elite Ottoman infantry. Enslaved as boys, trained as soldiers.'],
    ['LIEGE','A lord to whom feudal allegiance was owed. Loyalty above all.'],
    ['MANOR','The basic unit of medieval land ownership. The lord lived here.'],
    ['POLIS','The Greek city-state. Athens and Sparta were famous ones.'],
    ['RUNES','Ancient Germanic alphabet. Used by Vikings for writing and divination.'],
    ['SLAVE','A person owned as property. The trade shaped continents permanently.'],
    ['AGORA','The central public space in ancient Greek city-states. Democracy happened here.'],
    ['BARDS','Celtic oral poets who preserved history and legend through song.'],
  ],

  geopolitics: [
    ['VETO', 'The power to block a decision. UN Security Council members have it.'],
    ['JUNTA','A military group that has taken control of a government.'],
    ['PROXY','In geopolitics, a war fought through third parties by major powers.'],
    ['PACT', 'A formal agreement between nations. The Molotov-Ribbentrop was one.'],
    ['ROGUE','A state that defies international norms. A contested label.'],
    ['TROOP','A group of soldiers. Troop deployments signal escalation.'],
    ['TRADE','The exchange of goods between nations. The source of most conflicts.'],
    ['REBEL','An armed group fighting against a government or authority.'],
    ['DRONE','An unmanned aerial vehicle. Redefined modern warfare.'],
    ['INTEL','Gathered information about an adversary. What spies collect.'],
    ['PIVOT','A strategic shift in foreign policy. Obama pivoted to Asia.'],
    ['OPTIC','In politics, how something appears publicly matters as much as reality.'],
    ['PURGE','The removal of opponents from a political party or government.'],
    ['EXILE','Forced removal from ones country. Used to neutralise opponents.'],
    ['DEPOT','A military storage facility. Strategic in any conflict.'],
    ['STALL','A delay tactic in negotiations. Often used to buy time.'],
    ['FRONT','A political coalition or an active line of military engagement.'],
    ['TALKS','Diplomatic negotiations. Usually preceded by a crisis.'],
    ['ENVOY','A diplomatic representative. When talks are happening, envoys fly.'],
    ['ANNEX','To incorporate territory into a state by force or agreement.'],
    ['BLOCS','Groups of countries aligned politically. Cold War had two main ones.'],
    ['TRUCE','A temporary halt to fighting while negotiations continue.'],
    ['DETENTE','A period of improved relations between previously hostile powers.'],
    ['JINGO','Extreme patriotism expressed through aggressive foreign policy.'],
    ['LOBBY','A group that influences government on behalf of a special interest.'],
    ['MEDIA','In geopolitics, the fourth estate. Who controls the narrative wins.'],
    ['SANCTION','Economic penalty imposed on a country. The non-military weapon.'],
    ['TREATY','A formal agreement between two or more states. Binding in theory.'],
    ['COVERT','Secret. As in covert operations. The CIA specialty.'],
    ['FORUM','An international meeting place. Davos. The UN. The G20.'],
    ['HAWK', 'A politician who favours aggressive or warlike foreign policy.'],
    ['PEACE','The goal. Elusive. Worth pursuing regardless.'],
    ['RALLY','A large public gathering in support of a political cause.'],
    ['SIEGE','Surrounding a territory to force surrender. Ancient and modern tactic.'],
    ['SPOOK','Informal for a spy or intelligence officer. Not the ghost kind.'],
    ['STATE','An organised political community occupying a defined territory.'],
    ['UNION','A political alliance or federation of states or workers.'],
    ['VOTE', 'The mechanism of democratic participation. Precious. Often taken for granted.'],
    ['ZONES','Designated areas with specific rules. Buffer zones. Exclusion zones.'],
    ['ARMS', 'Weapons collectively. Arms trade. Arms control. Arms race.'],
    ['AGENT','A spy or operative working for an intelligence service.'],
    ['ASSET','A person working for an intelligence agency, often without knowing it.'],
    ['MOLES','Spies who have infiltrated the organisation they are reporting on.'],
    ['ORDER','The prevailing system of international relations. The liberal order.'],
  ],

  culture: [
    ['MANGA','Japanese comics. The art form that influenced a generation of illustrators.'],
    ['OPERA','An art form combining singing, orchestral music, and theatre.'],
    ['MURAL','A work of art painted directly onto a wall. Street art at scale.'],
    ['BATIK','A wax-resist dyeing technique originating in Java.'],
    ['PROSE','Written or spoken language in its ordinary, non-poetic form.'],
    ['LYRIC','The words of a song. Or poetry expressing personal emotion.'],
    ['TANGO','A passionate partnered dance originating in Buenos Aires.'],
    ['TAPAS','Small Spanish dishes. The social eating style Europe copied.'],
    ['RAMEN','Japanese noodle soup with a devoted global following.'],
    ['SUSHI','Vinegared rice with various toppings. Precision food.'],
    ['CREPE','A thin French pancake. Sweet or savoury. Always better than expected.'],
    ['SALSA','A dance, a sauce, and a genre of music. The same word covers all three.'],
    ['HAIKU','A Japanese poem in three lines: 5-7-5 syllables.'],
    ['AZTEC','The Mesoamerican civilisation that built Tenochtitlan.'],
    ['MAORI','The indigenous Polynesian people of New Zealand.'],
    ['TOTEM','A natural object adopted as an emblem by a person or clan.'],
    ['PLAZA','An open public square in a town or city. The social centre.'],
    ['BAZAAR','A Middle Eastern or South Asian market. Organised chaos.'],
    ['FEAST','A large meal, especially one marking a celebration or ritual.'],
    ['CANOE','A narrow boat propelled by paddles. Indigenous water transport.'],
    ['TABOO','A social or religious custom prohibiting certain actions.'],
    ['MOSAIC','Small coloured tiles arranged to form an image or pattern.'],
    ['SHRINE','A sacred place dedicated to a deity or venerated person.'],
    ['BLUES','A music genre originating in the African American South.'],
    ['DENIM','A sturdy cotton fabric. Levi Strauss made it iconic.'],
    ['GUMBO','A Louisiana stew. African, French, and Native American traditions merged.'],
    ['KEBAB','Grilled meat on a skewer. Middle Eastern in origin, global in appeal.'],
    ['LATTE','An espresso with steamed milk. The universal language of work.'],
    ['NOODLE','Long pasta or Asian wheat noodles. The most eaten food on Earth.'],
    ['PATINA','The green or brown film on old metal. The beautiful mark of time.'],
    ['QUILT','A bed covering of stitched fabric layers. A folk art tradition worldwide.'],
    ['SAUNA','A Finnish steam bath. A spiritual and social ritual.'],
    ['TAPIR','A large browsing mammal. Ancient. Looks like it should be extinct.'],
    ['VINYL','A plastic disc for playing recorded music. Made a comeback nobody predicted.'],
    ['WALTZ','A ballroom dance in triple time. Viennese in origin.'],
    ['XYLOPHONE','A percussion instrument of wooden bars struck by mallets.'],
    ['YAKUZA','The Japanese organised crime syndicate. Known for elaborate tattoos.'],
    ['HENNA','A plant-based dye used for temporary body art. South Asian tradition.'],
    ['ICONS','Sacred images in Eastern Christian traditions. Also clickable symbols.'],
    ['PLAZA','The central square of a Spanish or Latin American town.'],
    ['CURRY','A dish seasoned with spices. Originated in the Indian subcontinent.'],
    ['SITAR','A plucked string instrument from the Indian subcontinent.'],
    ['TZAR', 'The title of Russian emperors. Also spelled tsar or czar.'],
    ['BAGEL','A ring-shaped bread roll. Jewish in origin, universal in appeal.'],
    ['BOSSA','As in Bossa Nova. A Brazilian music genre blending samba and jazz.'],
  ],

  sport: [
    ['RUGBY','A contact sport played with an oval ball. Invented at Rugby School in 1823.'],
    ['CHESS','A strategy board game on 64 squares. Not technically a sport but feels like one.'],
    ['DRAFT','In American sports, the process of selecting new players each season.'],
    ['MATCH','A game or contest between two sides. A loaded word in tennis.'],
    ['PITCH','The playing surface for football, cricket, or hockey.'],
    ['RELAY','A race where teams of runners each complete part of the distance.'],
    ['GUARD','A defensive position in basketball. Also protects the quarterback.'],
    ['SERVE','The stroke that begins each point in tennis or volleyball.'],
    ['RALLY','A sustained exchange of shots in tennis. Also a political event.'],
    ['FOUL', 'An infringement of the rules. In basketball, you get five.'],
    ['CATCH','A fundamental skill in cricket, baseball, and American football.'],
    ['DRIVE','A long, powerful shot in golf. Or the determination to succeed.'],
    ['SWEEP','To win every game in a series. Also a cricket shot.'],
    ['DEBUT','A player first appearance for a team or in a competition.'],
    ['MEDAL','The tangible reward for excellence at the Olympic Games.'],
    ['SQUAD','The full group of players from which a team is selected.'],
    ['TRACK','The oval circuit for athletics or cycling.'],
    ['COURT','The playing surface for tennis, basketball, or squash.'],
    ['STAKE','What is at risk in a competition. High stakes, high pressure.'],
    ['DRILLS','Repetitive training exercises. The foundation of any skill.'],
    ['ROUND','One complete sequence of play. Boxing has 12. Golf has 18 holes.'],
    ['SCOUT','A person who identifies talented players for a team.'],
    ['SPORT','Physical activity governed by rules and usually competitive.'],
    ['COACH','The person responsible for training and directing a team.'],
    ['TITLE','The championship. What everyone is playing for.'],
    ['ZONES','Defensive formations divide the court or field into zones.'],
    ['SLOPE','In skiing, the inclined surface you ski down. Simple concept, terrifying reality.'],
    ['SPRINT','Running at maximum speed over a short distance.'],
    ['ROUTE','In climbing, a specific path up a rock face or mountain.'],
    ['PARRY','In fencing, a defensive action to deflect an attack.'],
    ['BOXER','A fighter. Also a dog breed. Also a style of underwear. One word, three worlds.'],
    ['EAGLE','In golf, two under par on a hole. Better than a birdie.'],
    ['FRONT','In surfing, the front foot controls direction. Technique matters.'],
    ['GATES','In skiing or cycling, the markers you must pass through.'],
    ['HOLES','In golf, the 18 challenges that define a round.'],
    ['LUNGE','A forward thrust in fencing. Also a leg exercise in the gym.'],
    ['MOUNT','In equestrian sports, the horse. Also to climb onto the horse.'],
    ['OVERS','In cricket, a set of six balls bowled by the same bowler.'],
    ['POACH','In tennis, a net player stealing a shot intended for their partner.'],
    ['SEEDS','Top-ranked players protected from each other in early rounds.'],
    ['THROW','A fundamental action in athletics. Shot put. Discus. Javelin.'],
    ['UPSET','When the underdog beats the favourite. The best moment in sport.'],
    ['VOLLEY','Hitting a ball before it bounces. Requires timing and courage.'],
    ['WEDGE','A golf club used for short approach shots near the green.'],
  ],

  general: [
    ['IRONY','When what happens is the opposite of what you expected. Often misused.'],
    ['AXIOM','A statement accepted as self-evidently true without proof.'],
    ['TACIT','Understood without being stated. An unspoken agreement.'],
    ['QUIRK','A peculiar habit or characteristic. Usually the most interesting part.'],
    ['STOIC','Enduring pain or hardship without complaint. Also a philosopher.'],
    ['CHAOS','Complete disorder. Also the state before the universe was organised.'],
    ['PIVOT','To turn around a fixed point. In business, to change direction entirely.'],
    ['KNACK','A special skill or talent. Some people just have it.'],
    ['FLAIR','A natural talent or stylish quality. She has it. Obviously.'],
    ['CRISP','Dry, clean, precise. Also a potato snack. Both are good.'],
    ['ADAGE','A short statement expressing a general truth. A proverb.'],
    ['CLOUT','Influence or power. Also to strike someone. Both still used.'],
    ['GUILE','Sly or cunning intelligence. The charming kind of deception.'],
    ['LUCID','Clear and easily understood. What good design always is.'],
    ['MELEE','A confused fight involving many people. Or a French word for chaos.'],
    ['NAIVE','Lacking experience or wisdom. Not necessarily an insult.'],
    ['TEMPO','The speed of music, speech, or any recurring activity.'],
    ['VIGOR','Active physical or mental strength. What she brings to everything.'],
    ['ZEAL', 'Great energy or enthusiasm. The good kind of obsession.'],
    ['BRASH','Self-assertive in a rude, noisy way. Confidence without tact.'],
    ['CRAVE','To feel a powerful desire for something. Human. Constant.'],
    ['DREAD','Great fear or apprehension. The Sunday evening feeling.'],
    ['ETHOS','The characteristic spirit or values of a culture or era.'],
    ['FRUGAL','Economical with money or resources. Does not mean cheap.'],
    ['GRAFT','Hard work. Or corruption. Or a plant cutting. Depends on context.'],
    ['HASTE','Excessive speed or urgency. Usually makes waste.'],
    ['INEPT','Lacking skill or ability. The opposite of Divya at her job.'],
    ['JOUST','A medieval combat on horseback. The original tournament.'],
    ['KARMA','The concept that actions have consequences. Universal. Slow. Reliable.'],
    ['LAPSE','A temporary failure of concentration or memory.'],
    ['MIRTH','Amusement expressed through laughter. A wonderful word for joy.'],
    ['NOVEL','New and not resembling something formerly known. Also a long book.'],
    ['OMEN', 'An event seen as a sign of future good or evil. Open to interpretation.'],
    ['POISE','Graceful and elegant composure. What she has entering any room.'],
    ['QUALM','An uneasy feeling of doubt or scruple. A small but persistent worry.'],
    ['REMIT','The task or area of activity officially assigned to a person.'],
    ['SAVOR','To taste or enjoy something slowly and appreciatively.'],
    ['TERSE','Sparing with words. Brief and direct. The best kind of writing.'],
    ['UNDUE','Excessive or inappropriate. Undue pressure. Undue influence.'],
    ['VALID','Having a sound basis in logic or fact. Not all opinions are.'],
    ['WIELD','To hold and use a weapon or tool. Also to exercise power or influence.'],
    ['YIELD','To produce or provide. Or to give way. Both involve a kind of surrender.'],
    ['ACUTE','Present to a severe degree. Also describes a sharp angle.'],
    ['BLUNT','Not sharp. Or direct to the point of rudeness. Or a type of cigar.'],
    ['CRUX', 'The decisive or most important point. Getting to the crux of things.'],
    ['DEFT', 'Neatly skillful and quick. What her hands are when she works.'],
    ['EERIE','Strange and frightening. The feeling at 3am in an unfamiliar place.'],
    ['FRANK','Open and direct in speech. Or a person named Frank.'],
    ['GLEAN','To extract information from various sources. Journalists and detectives glean.'],
    ['HARSH','Unpleasantly rough or jarring. A harsh truth. A harsh winter.'],
    ['IMPLY','To suggest without stating directly. More powerful than saying outright.'],
    ['JADED','Tired and bored from overexposure. Every food critic eventually.'],
    ['KEENLY','With eagerness and enthusiasm. She approaches most things keenly.'],
  ],

};

// ─── Category config ───────────────────────────────────────────────────────────
const CATEGORIES = {
  random:      { label: '🎲 Random',        color: 'var(--mint)',   desc: 'Anything goes. All categories.' },
  design:      { label: '🎨 Design & Photo', color: 'var(--lilac)', desc: 'Divya\'s home turf. Should be easy. Isn\'t.' },
  geography:   { label: '🌍 Geography',      color: '#4CAF82',      desc: 'Countries, cities, landforms.' },
  science:     { label: '🔬 Science',        color: '#4FC3F7',      desc: 'Physics, biology, chemistry.' },
  history:     { label: '📜 History',        color: 'var(--amber)', desc: 'Empires, events, eras.' },
  geopolitics: { label: '⚖️ Geopolitics',    color: 'var(--rose)',  desc: 'Power, conflict, diplomacy.' },
  culture:     { label: '🎭 Culture & Food', color: '#FF8C42',      desc: 'Art, dance, food, traditions.' },
  sport:       { label: '🏆 Sport',          color: '#66BB6A',      desc: 'Games, athletes, tactics.' },
  general:     { label: '💡 General',        color: '#9575CD',      desc: 'Words, concepts, ideas.' },
};

// Flatten all words for random + valid set
const ALL_WORDS = Object.values(BANK).flat();
const VALID = new Set([
  ...ALL_WORDS.map(e => e[0]),
  // Common 5-letter words for guessing (not secret words)
  'ABOUT','ABOVE','ADULT','AFTER','AGAIN','AGENT','AGREE','AHEAD','ALARM','ALBUM',
  'ALERT','ALIVE','ALLOW','ALONE','ALTER','ANGEL','ANGLE','ANGRY','APART','APPLY',
  'ARISE','ARRAY','ASIDE','AUDIO','AVOID','AWAKE','AWARE','BACON','BADGE','BASIC',
  'BASIS','BATCH','BEACH','BEARD','BEGAN','BEGIN','BEING','BELOW','BENCH','BIRTH',
  'BLACK','BLADE','BLANK','BLAST','BLAZE','BLIND','BLOCK','BLOOD','BLOWN','BLUES',
  'BOARD','BONUS','BOOST','BRACE','BRAIN','BRAVE','BREAD','BREAK','BREED','BRICK',
  'BRIEF','BRING','BROAD','BROKE','BROWN','BUDDY','BUILD','BUILT','BURST','BUYER',
  'CABIN','CANDY','CARRY','CATCH','CAUSE','CHAIN','CHAIR','CHASE','CHECK','CHEST',
  'CHIEF','CHILD','CLAIM','CLASS','CLEAR','CLIMB','CLOSE','CLOUD','COAST','COULD',
  'COUNT','COVER','CRACK','CRANE','CRASH','CRAZY','CREAM','CRIME','CROSS','CROWD',
  'CROWN','CRUSH','DANCE','DIRTY','DOUBT','DRAMA','DREAM','DRIVE','DROVE','DRUMS',
  'EARLY','EARTH','EIGHT','ELITE','EMPTY','ENEMY','ENJOY','ENTER','EVERY','EXACT',
  'EXTRA','FAINT','FAITH','FALSE','FANCY','FAULT','FEAST','FIELD','FINAL','FIRED',
  'FIXED','FLOAT','FLOOD','FLOOR','FORCE','FORGE','FOUND','FRESH','FRONT','FROZE',
  'FULLY','FUNNY','GHOST','GIVEN','GLASS','GLOBE','GLORY','GRACE','GRADE','GRAND',
  'GRANT','GRASP','GRASS','GRAVE','GREAT','GREEN','GRIEF','GRIND','GROUP','GROWN',
  'GUARD','GUIDE','HAPPY','HARSH','HEART','HEAVY','HONEY','HONOR','HOUSE','HUMAN',
  'HUMOR','IDEAL','IMAGE','INNER','JEWEL','JOINT','JUDGE','JUICE','KNIFE','KNOCK',
  'KNOWN','LABOR','LARGE','LASER','LATER','LAUGH','LEARN','LEAVE','LEMON','LIMIT',
  'LOCAL','LOOSE','LOWER','LUCKY','MAGIC','MAJOR','MAKER','MARCH','MASON','MATCH',
  'MODEL','MONEY','MONTH','MORAL','MOUSE','MOVIE','MUSIC','NERVE','NIGHT','NOBLE',
  'NOISE','NORTH','NOVEL','NURSE','OFFER','OFTEN','OCEAN','ORDER','PAINT','PANEL',
  'PAPER','PAUSE','PEACE','PEARL','PHASE','PHOTO','PIANO','PIECE','PILOT','PLACE',
  'PLANE','PLANT','POWER','PRESS','PRICE','PROBE','PROSE','QUERY','QUEUE','QUICK',
  'QUIET','QUOTE','RADAR','RADIO','RAISE','RALLY','RANGE','RAPID','RATIO','REACH',
  'REALM','REBEL','REPLY','RESET','RIDER','RIGHT','RIGID','RISKY','RIVAL','ROCKY',
  'ROUND','ROUTE','ROYAL','RULER','SAINT','SCENE','SCORE','SCOUT','SENSE','SERVE',
  'SEVEN','SHADE','SHAKE','SHAME','SHIFT','SHINE','SIGHT','SKILL','SKULL','SLEEP',
  'SLICE','SLIDE','SMALL','SMART','SMELL','SMILE','SMOKE','SOUND','SOUTH','SPEAK',
  'SPEND','SPLIT','SPORT','SPRAY','SQUAD','STACK','STAFF','STAGE','STAND','STARS',
  'STATE','STEAL','STEAM','STEEL','STONE','STORE','STORM','STORY','STUCK','STUDY',
  'SUGAR','SUITE','SUNNY','SUPER','SWEET','SWIFT','SWING','TABLE','TASTE','TEACH',
  'TEARS','TEETH','THEME','THICK','THINK','THREE','THROW','TIGER','TIGHT','TIMES',
  'TIRED','TITLE','TOAST','TODAY','TOKEN','TOTAL','TOUCH','TOUGH','TOWER','TRACK',
  'TRADE','TRAIL','TRAIN','TRAIT','TREAT','TREND','TRIAL','TRICK','TRIED','TRULY',
  'TRUST','TRUTH','UNDER','UNION','UNITY','UNTIL','UPPER','UPSET','VALUE','VIDEO',
  'VIRAL','VISIT','VITAL','VOICE','WASTE','WATCH','WATER','WEARY','WEIRD','WHITE',
  'WHOLE','WOMEN','WORLD','WORSE','WORTH','WRITE','WRONG','YOUNG','YOUTH','ZEBRA',
  'LYRIC','TANGO','MURAL','JOUST','SWIPE','VENOM','AXIOM','TACIT','FLAIR','GUILE',
  'LUCID','MELEE','NAIVE','TEMPO','VIGIL','BRASH','CRAVE','DREAD','COMET','HELIX',
  'OZONE','SPORE','GAUGE','PRISM','ALLOY','ALGAE','EDICT','SIEGE','TRUCE','ENVOY',
  'PAGAN','RELIC','LIEGE','PURGE','EXILE','STALL','FJORD','DELTA','OASIS','ATOLL',
  'STEPPE','MANGA','OPERA','BATIK','TAPAS','RAMEN','SUSHI','CREPE','SALSA','HAIKU',
  'KABUKI','AZTEC','MAORI','GRIOT','TOTEM','SHRINE','BAZAAR','GUILD','RELAY','FLANK',
]);

// ─── State ─────────────────────────────────────────────────────────────────────
const MAX_GUESSES = 6;
const WORD_LEN    = 5;

let answer      = '';
let answerFlavour = '';
let answerCat   = 'random';
let guesses     = [];
let currentRow  = 0;
let currentStr  = '';
let gameOver    = false;
let rootEl      = null;
let _keyHandler = null;
let sessionWins = 0;
let sessionStreak = 0;
let usedWords   = new Set();

// ─── Pick a word ──────────────────────────────────────────────────────────────
function pickWord(cat) {
  const pool = cat === 'random'
    ? ALL_WORDS.filter(e => e[0].length === 5)
    : (BANK[cat] || []).filter(e => e[0].length === 5);
  const unused = pool.filter(e => !usedWords.has(e[0]));
  const source = unused.length > 0 ? unused : pool; // recycle if exhausted
  const entry  = source[Math.floor(Math.random() * source.length)];
  return entry || pool[0];
}

// ─── Evaluate ─────────────────────────────────────────────────────────────────
function evaluate(guess, target) {
  const result = Array(WORD_LEN).fill('absent');
  const tLeft  = target.split('');
  const gLeft  = guess.split('');
  gLeft.forEach((l, i) => {
    if (l === tLeft[i]) { result[i] = 'correct'; tLeft[i] = null; gLeft[i] = null; }
  });
  gLeft.forEach((l, i) => {
    if (!l) return;
    const j = tLeft.indexOf(l);
    if (j !== -1) { result[i] = 'present'; tLeft[j] = null; }
  });
  return result;
}

// ─── DOM ──────────────────────────────────────────────────────────────────────
function getTile(r, c) { return rootEl?.querySelector(`.wl-tile[data-r="${r}"][data-c="${c}"]`); }
function getKey(k)     { return rootEl?.querySelector(`.wl-key[data-k="${k}"]`); }

function renderInput() {
  for (let c = 0; c < WORD_LEN; c++) {
    const t  = getTile(currentRow, c);
    if (!t) continue;
    t.textContent = currentStr[c] || '';
    t.dataset.state = currentStr[c] ? 'filled' : '';
  }
}

function updateCtr() {
  const el = rootEl?.querySelector('.wl-guess-ctr');
  if (el) el.textContent = `Guess ${Math.min(currentRow + 1, MAX_GUESSES)} of ${MAX_GUESSES}`;
}

function shakeRow(r) {
  for (let c = 0; c < WORD_LEN; c++) {
    const t = getTile(r, c);
    t?.classList.add('wl-shake');
    setTimeout(() => t?.classList.remove('wl-shake'), 600);
  }
}

function revealRow(r, result, done) {
  for (let c = 0; c < WORD_LEN; c++) {
    const t = getTile(r, c); if (!t) continue;
    const state = result[c], letter = t.textContent;
    setTimeout(() => {
      t.classList.add('wl-flip-out');
      setTimeout(() => {
        t.classList.remove('wl-flip-out');
        t.classList.add(`wl-${state}`);
        t.dataset.state = state;
        // Apply flip-in AFTER colour class so animation plays on already-coloured tile
        requestAnimationFrame(() => t.classList.add('wl-flip-in'));
        const k = getKey(letter);
        if (k) {
          const pri = { correct:3, present:2, absent:1 };
          if ((pri[state]||0) > (pri[k.dataset.state]||0)) k.dataset.state = state;
        }
        // Remove only the animation class, keep colour class permanently
        setTimeout(() => t.classList.remove('wl-flip-in'), 220);
      }, 200);
    }, c * 90);
  }
  setTimeout(done, WORD_LEN * 90 + 420);
}

function bounceRow(r) {
  for (let c = 0; c < WORD_LEN; c++) {
    const t = getTile(r, c);
    setTimeout(() => t?.classList.add('wl-bounce'), c * 80);
    setTimeout(() => t?.classList.remove('wl-bounce'), c * 80 + 800);
  }
}

// ─── Toast ────────────────────────────────────────────────────────────────────
let _toastTimer;
function toast(msg, dur = 1900) {
  const el = rootEl?.querySelector('.wl-toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), dur);
}

const NEAR_MISS = [
  'Getting warm. Stay in the category.',
  'You can smell it from here.',
  'One more look at those yellows.',
  'Almost. Think harder.',
  'Your brain knows this.',
];
const LAST_CHANCE = [
  'Last guess. Trust your gut.',
  'Final shot. Make it count.',
  'One word stands between you and glory.',
];

// ─── Result panel ─────────────────────────────────────────────────────────────
function showResult(won, guessCount) {
  const el = rootEl?.querySelector('.wl-result');
  if (!el) return;

  if (won) { sessionWins++; sessionStreak++; }
  else     { sessionStreak = 0; }

  // Update session counter
  const ctrEl = rootEl?.querySelector('.wl-session-ctr');
  if (ctrEl) ctrEl.innerHTML = `
    <span class="wl-sc-item">✅ ${sessionWins} solved</span>
    <span class="wl-sc-item">🔥 ${sessionStreak} streak</span>
  `;

  const catCfg = CATEGORIES[answerCat] || CATEGORIES.random;
  const badge = won ? [
    { e:'🔮', t:'PSYCHIC',       m:'One guess? Come on.' },
    { e:'👑', t:'ELITE',         m:'Two guesses. Showing off.' },
    { e:'✨', t:'SHARP',         m:'Three. Clean. Satisfying.' },
    { e:'🎨', t:'SOLID',         m:'Four tries. Good solve.' },
    { e:'🔥', t:'CLOSE CALL',    m:'Five. Made it count.' },
    { e:'🎲', t:'LAST PIXEL',    m:'Six. The wire. You held on.' },
  ][guessCount - 1] : { e:'😔', t:'NEXT TIME', m:'It happens. Play again.' };

  el.innerHTML = `
    <div class="wlr-inner">
      <div class="wlr-emoji">${badge.e}</div>
      <div class="wlr-badge">${badge.t}</div>
      <div class="wlr-tagline">${badge.m}</div>
      <div class="wlr-word">The word was <span class="wlr-answer">${answer}</span></div>
      ${answerFlavour ? `<div class="wlr-flavour">"${answerFlavour}"</div>` : ''}
      <div class="wlr-cat-tag" style="background:${catCfg.color}22;border-color:${catCfg.color}44;color:${catCfg.color}">${catCfg.label}</div>
      <div class="wlr-actions">
        <button class="btn btn-primary wlr-btn" id="wlPlayAgainBtn">Play Again →</button>
        <button class="btn btn-ghost wlr-btn" id="wlChangeCatBtn">Change Category</button>
      </div>
      <button class="wlr-share-sm" id="wlShareBtn">Share result 📋</button>
    </div>
  `;

  setTimeout(() => el.classList.add('wl-result--visible'), 200);

  el.querySelector('#wlPlayAgainBtn')?.addEventListener('click', () => {
    el.classList.remove('wl-result--visible');
    setTimeout(() => startRound(answerCat), 300);
  });
  el.querySelector('#wlChangeCatBtn')?.addEventListener('click', () => {
    el.classList.remove('wl-result--visible');
    setTimeout(() => showCategoryPicker(), 300);
  });
  el.querySelector('#wlShareBtn')?.addEventListener('click', () => {
    const rows = guesses.map(g =>
      evaluate(g, answer).map(s => s==='correct'?'🟩':s==='present'?'🟨':'⬛').join('')
    );
    const txt = `DIVYADLE ∞\n${catCfg.label} · ${won ? guessCount : 'X'}/${MAX_GUESSES}\n\n${rows.join('\n')}\ncdivya.pocketprojects.in`;
    navigator.clipboard?.writeText(txt)
      .then(() => toast('Copied! ✓', 1400))
      .catch(() => toast(txt, 5000));
  });
}

// ─── Category picker ──────────────────────────────────────────────────────────
function showCategoryPicker() {
  if (!rootEl) return;
  const seen = sessionStorage.getItem('divyadle_seen');

  const howToHTML = !seen ? `
    <div class="wl-quick-rules">
      <p>Guess the <strong>5-letter word</strong> in <strong>6 tries</strong>. After each guess:</p>
      <div class="wl-rule-row"><div class="wl-demo-tile wl-correct">A</div><span><strong>Green</strong> = right letter, right spot</span></div>
      <div class="wl-rule-row"><div class="wl-demo-tile wl-present">B</div><span><strong>Yellow</strong> = right letter, wrong spot</span></div>
      <div class="wl-rule-row"><div class="wl-demo-tile wl-absent">C</div><span><strong>Grey</strong> = not in the word</span></div>
      <p class="wl-tip">💡 Start with <strong>RAISE</strong> or <strong>CRANE</strong> — covers the most common letters.</p>
    </div>
  ` : '';

  rootEl.innerHTML = `
    <div class="wl-picker">
      <div class="wl-picker-header">
        <h2 class="wl-title">DIVYADLE ∞</h2>
        <div class="wl-session-ctr">
          <span class="wl-sc-item">✅ ${sessionWins} solved</span>
          <span class="wl-sc-item">🔥 ${sessionStreak} streak</span>
        </div>
        <p class="wl-picker-sub">Choose a category. Guess the word. Play forever.</p>
      </div>
      ${howToHTML}
      <div class="wl-cat-grid">
        ${Object.entries(CATEGORIES).map(([key, cfg]) => `
          <button class="wl-cat-card" data-cat="${key}" style="--cc:${cfg.color}">
            <span class="wl-cat-label">${cfg.label}</span>
            <span class="wl-cat-desc">${cfg.desc}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;

  sessionStorage.setItem('divyadle_seen', '1');

  rootEl.querySelectorAll('.wl-cat-card').forEach(btn => {
    btn.addEventListener('click', () => startRound(btn.dataset.cat));
  });
}

// ─── Round ────────────────────────────────────────────────────────────────────
function startRound(cat) {
  answerCat  = cat || 'random';
  const entry = pickWord(answerCat);
  answer        = entry[0];
  answerFlavour = entry[1] || '';
  usedWords.add(answer);
  guesses    = [];
  currentRow = 0;
  currentStr = '';
  gameOver   = false;

  const catCfg = CATEGORIES[answerCat] || CATEGORIES.random;

  let grid = '<div class="wl-grid">';
  for (let r = 0; r < MAX_GUESSES; r++) {
    grid += '<div class="wl-row">';
    for (let c = 0; c < WORD_LEN; c++) grid += `<div class="wl-tile" data-r="${r}" data-c="${c}"></div>`;
    grid += '</div>';
  }
  grid += '</div>';

  const rows = ['QWERTYUIOP','ASDFGHJKL','⌫ZXCVBNM↵'];
  let kb = '<div class="wl-kb">';
  for (const row of rows) {
    kb += '<div class="wl-kb-row">';
    for (const ch of [...row]) {
      const wide = (ch==='⌫'||ch==='↵') ? ' wl-key--wide' : '';
      kb += `<button class="wl-key${wide}" data-k="${ch}">${ch==='↵'?'ENTER':ch}</button>`;
    }
    kb += '</div>';
  }
  kb += '</div>';

  rootEl.innerHTML = `
    <div class="wl-game-header">
      <div class="wl-game-title-row">
        <h2 class="wl-title">DIVYADLE ∞</h2>
        <button class="wl-cat-pill" id="wlChangeCat" style="--cc:${catCfg.color}">${catCfg.label}</button>
      </div>
      <div class="wl-game-sub">
        <span class="wl-session-mini">✅ ${sessionWins} &nbsp; 🔥 ${sessionStreak}</span>
        <span class="wl-guess-ctr">Guess 1 of 6</span>
        <button class="wl-help-sm" id="wlHelpBtn">?</button>
      </div>
    </div>

    <div class="wl-howto" id="wlHowTo">
      <div class="wl-howto-inner">
        <p class="wl-howto-rule">Guess the 5-letter word in 6 tries. All words fit the chosen category.</p>
        <div class="wl-howto-legend">
          <div class="wl-howto-row"><div class="wl-demo-tile wl-correct">G</div><div><strong>Green</strong> — right letter, right position</div></div>
          <div class="wl-howto-row"><div class="wl-demo-tile wl-present">R</div><div><strong>Yellow</strong> — letter in word, wrong position</div></div>
          <div class="wl-howto-row"><div class="wl-demo-tile wl-absent">X</div><div><strong>Grey</strong> — letter not in the word</div></div>
        </div>
        <p class="wl-howto-tip">💡 Start with RAISE or CRANE to cover the most common letters first.</p>
      </div>
    </div>

    <div class="wl-toast" aria-live="assertive"></div>
    ${grid}
    <div class="wl-result" aria-live="polite"></div>
    ${kb}
  `;

  // Help toggle
  const helpBtn = rootEl.querySelector('#wlHelpBtn');
  const howToEl = rootEl.querySelector('#wlHowTo');
  helpBtn?.addEventListener('click', () => {
    const open = howToEl?.classList.toggle('wl-howto--open');
    if (helpBtn) helpBtn.textContent = open ? '✕' : '?';
  });

  // Category change
  rootEl.querySelector('#wlChangeCat')?.addEventListener('click', () => showCategoryPicker());

  // Keyboard
  rootEl.querySelectorAll('.wl-key').forEach(btn => {
    btn.addEventListener('click', () => handleKey(btn.dataset.k));
  });

  updateCtr();
}

// ─── Input ────────────────────────────────────────────────────────────────────
function handleKey(k) {
  if (gameOver) return;
  k = k.toUpperCase();
  if (k === 'ENTER' || k === '↵') {
    submitGuess();
  } else if (k === 'BACKSPACE' || k === '⌫') {
    currentStr = currentStr.slice(0, -1);
    renderInput();
  } else if (/^[A-Z]$/.test(k) && currentStr.length < WORD_LEN) {
    currentStr += k;
    renderInput();
    const t = getTile(currentRow, currentStr.length - 1);
    t?.classList.add('wl-pop');
    setTimeout(() => t?.classList.remove('wl-pop'), 130);
  }
}

function submitGuess() {
  if (currentStr.length < WORD_LEN) { shakeRow(currentRow); toast('Need 5 letters'); return; }
  const upper = currentStr.toUpperCase();
  if (!VALID.has(upper)) { shakeRow(currentRow); toast('Not a recognised word — try again'); return; }

  guesses[currentRow] = upper;
  const result = evaluate(upper, answer);

  revealRow(currentRow, result, () => {
    const won = result.every(r => r === 'correct');
    if (won) {
      bounceRow(currentRow);
      gameOver = true;
      setTimeout(() => showResult(true, currentRow + 1), 600);
    } else if (currentRow + 1 >= MAX_GUESSES) {
      gameOver = true;
      setTimeout(() => { toast(`The word was ${answer}`, 2800); showResult(false, 0); }, 400);
    } else {
      if (currentRow === 3) setTimeout(() => toast(NEAR_MISS[Math.floor(Math.random()*NEAR_MISS.length)], 2200), 500);
      if (currentRow === 4) setTimeout(() => toast(LAST_CHANCE[Math.floor(Math.random()*LAST_CHANCE.length)], 2400), 500);
    }
    currentRow++;
    updateCtr();
    currentStr = '';
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────
export function initWordle() {
  const card     = document.getElementById('openWordleCard');
  const modal    = document.getElementById('wordleModal');
  const closeBtn = document.getElementById('wordleClose');
  const overlay  = modal?.querySelector('.modal-overlay');
  const content  = document.getElementById('wordleContent');
  if (!card || !modal || !content) return;

  function openModal() {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    rootEl = content;
    showCategoryPicker();
    wireKeyboard();
  }
  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (_keyHandler) { document.removeEventListener('keydown', _keyHandler); _keyHandler = null; }
  }

  card.addEventListener('click', openModal);
  card.querySelector('.gc-btn')?.addEventListener('click', e => { e.stopPropagation(); openModal(); });
  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });
}

function wireKeyboard() {
  if (_keyHandler) document.removeEventListener('keydown', _keyHandler);
  _keyHandler = e => {
    if (!document.getElementById('wordleModal')?.classList.contains('open')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Enter')         handleKey('ENTER');
    else if (e.key === 'Backspace') handleKey('BACKSPACE');
    else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key);
  };
  document.addEventListener('keydown', _keyHandler);
}
