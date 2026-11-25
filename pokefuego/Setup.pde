// =====================================================================
//  Nueva partida y personalización: opciones, reglas, aleatorio,
//  personaje, apodos, Ayuda (preguntas frecuentes) y Pokédex completa
// =====================================================================

interface IntGet { int get(); }
interface StrGet { String get(); }

class Opt {
  String label, help = "";
  String[] vals;
  IntGet getter; IntCb setter;
  Cb action; StrGet display;
  Opt(String label, String help) { this.label = label; this.help = help; }
}

Opt tog(String label, String help, IntGet g, IntCb s) { Opt o = new Opt(label, help); o.vals = new String[]{"No", "Sí"}; o.getter = g; o.setter = s; return o; }
Opt cho(String label, String help, String[] vals, IntGet g, IntCb s) { Opt o = new Opt(label, help); o.vals = vals; o.getter = g; o.setter = s; return o; }
Opt act(String label, String help, Cb cb) { Opt o = new Opt(label, help); o.action = cb; return o; }
Opt actv(String label, String help, StrGet d, Cb cb) { Opt o = new Opt(label, help); o.action = cb; o.display = d; return o; }

class OptionsScene extends Scene {
  String title; ArrayList<Opt> rows = new ArrayList<Opt>();
  int sel = 0, top = 0, visible = 8;
  Cb extra;                 // dibujo extra a la derecha (vista previa)
  Cb onClose;
  OptionsScene(String title) { this.title = title; }
  float panelW() { return extra != null ? 560 : 880; }
  void draw() {
    background(16, 20, 32);
    txt(title, 40, 20, fBig, color(255, 220, 120));
    panel(40, 76, panelW(), visible * 46 + 16);
    for (int i = 0; i < visible && top + i < rows.size(); i++) {
      int idx = top + i; Opt o = rows.get(idx);
      float y = 84 + i * 46;
      panelSel(50, y, panelW() - 20, 42, idx == sel);
      txt(o.label, 66, y + 9, fNormal, idx == sel ? color(255, 230, 140) : color(235));
      String v = "";
      if (o.vals != null && o.getter != null) { int cv = constrain(o.getter.get(), 0, o.vals.length - 1); v = (idx == sel ? "◄ " : "") + o.vals[cv] + (idx == sel ? " ►" : ""); }
      else if (o.display != null) v = o.display.get();
      else if (o.action != null) v = "›";
      int vc = (o.vals != null && o.vals.length == 2 && o.getter != null) ? (o.getter.get() == 1 ? color(120, 230, 140) : color(190)) : color(255, 220, 120);
      txtr(v, 40 + panelW() - 26, y + 9, fNormal, vc);
    }
    if (top > 0) { fill(255, 220, 120); triangle(panelW() - 10, 70, panelW() + 4, 70, panelW() - 3, 62); }
    if (top + visible < rows.size()) { fill(255, 220, 120); triangle(panelW() - 10, 76 + visible * 46 + 22, panelW() + 4, 76 + visible * 46 + 22, panelW() - 3, 76 + visible * 46 + 30); }
    if (extra != null) extra.run();
    panel(40, 76 + visible * 46 + 32, 880, 86);
    if (sel < rows.size()) { textFont(fSmall); fill(225); textAlign(LEFT, TOP); text(rows.get(sel).help, 56, 76 + visible * 46 + 42, 848, 70); }
    txt("↑/↓ moverse · ←/→ cambiar · Z aceptar · X volver", 40, height - 26, fSmall, color(150));
  }
  void key(int k, char c) {
    if (rows.isEmpty()) return;
    if (k == K_UP) sel = (sel + rows.size() - 1) % rows.size();
    else if (k == K_DOWN) sel = (sel + 1) % rows.size();
    else if (k == K_BACK) { popScene(); if (onClose != null) onClose.run(); return; }
    else {
      Opt o = rows.get(sel);
      if (o.vals != null && o.getter != null && (k == K_LEFT || k == K_RIGHT || k == K_OK)) {
        int n = o.vals.length, cv = o.getter.get();
        cv = (k == K_LEFT) ? (cv + n - 1) % n : (cv + 1) % n;
        o.setter.run(cv);
      } else if (o.action != null && k == K_OK) o.action.run();
    }
    if (sel < top) top = sel;
    if (sel >= top + visible) top = sel - visible + 1;
  }
}

// =====================================================================
//  NUEVA PARTIDA
// =====================================================================
String[] CAP_NAMES = {"Rojo", "Azul", "Verde", "Amarillo", "Morado", "Naranja", "Blanco", "Negro"};
String[] SHIRT_NAMES = CAP_NAMES;
String[] HAIR_NAMES = {"Negro", "Castaño", "Rubio", "Pelirrojo", "Azul", "Blanco", "Verde", "Rosa"};
int[] palette() { return new int[]{color(220, 50, 50), color(60, 100, 220), color(60, 180, 90), color(240, 210, 60), color(150, 80, 200), color(240, 140, 40), color(240, 240, 240), color(40, 40, 50)}; }
int[] hairPalette() { return new int[]{color(30, 25, 30), color(110, 70, 40), color(230, 200, 100), color(200, 80, 40), color(60, 90, 220), color(235, 235, 240), color(70, 170, 90), color(240, 140, 180)}; }

void drawTrainer(float cx, float by, float sc, int capI, int shirtI, int hairI) {
  int[] pal = palette(), hp = hairPalette();
  pushMatrix(); translate(cx, by); scale(sc);
  noStroke();
  fill(0, 60); ellipse(0, 0, 70, 16);
  fill(50, 60, 110); rect(-14, -40, 12, 40, 4); rect(2, -40, 12, 40, 4);              // piernas
  fill(pal[shirtI % 8]); rect(-22, -88, 44, 52, 8);                                    // torso
  fill(250, 215, 180); rect(-30, -84, 10, 34, 5); rect(20, -84, 10, 34, 5);            // brazos
  ellipse(0, -104, 40, 40);                                                            // cabeza
  fill(hp[hairI % 8]); arc(0, -108, 42, 36, PI, TWO_PI); rect(-21, -108, 6, 18, 3); rect(15, -108, 6, 18, 3);   // pelo
  fill(pal[capI % 8]); arc(0, -112, 44, 34, PI, TWO_PI); rect(-8, -113, 38, 7, 3);     // gorra y visera
  fill(255); ellipse(-8, -102, 8, 9); ellipse(8, -102, 8, 9);
  fill(30); ellipse(-7, -101, 4, 5); ellipse(9, -101, 4, 5);
  popMatrix();
}

class NewSetup {
  Rules r = new Rules();
  String pname = "Rojo", rname = "Azul";
  int l0 = 0, l1 = 0, l2 = 0;
}

class NewGameScene extends OptionsScene {
  final NewSetup S = new NewSetup();
  NewGameScene() {
    super("NUEVA PARTIDA");
    final Rules r = S.r;
    rows.add(cho("Dificultad", "NORMAL: IA sencilla, rivales más débiles, Mega/Dinamax sólo en jefes avanzados. DIFÍCIL: IA que calcula daño y cambia a counters, jefes con Mega/Dinamax. EXTREMO: rivales +3 niveles, EVs al máximo, todos pueden Megaevolucionar/Dinamaxear, captura más difícil, sin tope de nivel.",
      new String[]{"Normal", "Difícil", "Extremo"}, new IntGet() { public int get() { return r.difficulty; } }, new IntCb() { public void run(int v) { r.difficulty = v; if (v == 2) r.levelCap = false; else r.levelCap = true; } }));
    rows.add(tog("Modo Nuzlocke", "Sólo capturas el primer Pokémon de cada zona y los que se debilitan mueren para siempre. Se puede ajustar en «Reglas Nuzlocke».",
      new IntGet() { public int get() { return r.nuzlocke ? 1 : 0; } }, new IntCb() { public void run(int v) { r.nuzlocke = v == 1; } }));
    rows.add(act("    Reglas Nuzlocke…", "Elige qué reglas del Nuzlocke se aplican.", new Cb() { public void run() { pushScene(nuzOptions(r)); } }));
    rows.add(tog("Modo aleatorio (todo)", "Activa o desactiva de golpe los iniciales, salvajes y entrenadores aleatorios. Usa «Personalizar aleatorio» para afinarlo.",
      new IntGet() { public int get() { return (r.randomStarters && r.randomWild && r.randomTrainers) ? 1 : 0; } }, new IntCb() { public void run(int v) { r.setRandom(v == 1); } }));
    rows.add(act("    Personalizar aleatorio…", "Habilidades, movimientos, legendarios, fuerza de los Pokémon, y qué se aleatoriza.", new Cb() { public void run() { pushScene(randomOptions(r)); } }));
    rows.add(act("Reglas generales…", "Tope de nivel, objetos en combate, apodos.", new Cb() { public void run() { pushScene(generalOptions(r)); } }));
    rows.add(actv("Personaje…", "Tu nombre, el nombre de tu rival y tu aspecto.", new StrGet() { public String get() { return S.pname + " vs " + S.rname; } }, new Cb() { public void run() { pushScene(characterOptions(S)); } }));
    rows.add(act("¡COMENZAR!", "Empieza la aventura con estas opciones.", new Cb() { public void run() {
      game = new Game(S.r, System.nanoTime());
      game.playerName = S.pname; game.rivalName = S.rname; game.look0 = S.l0; game.look1 = S.l1; game.look2 = S.l2; game.applyNames();
      popScene(); pushScene(new StarterScene());
    } }));
    visible = 8;
    extra = new Cb() { public void run() { drawTrainer(790, 320, 1.6f, S.l0, S.l1, S.l2); txtc(S.pname, 790, 345, fNormal, color(255, 230, 140)); } };
  }
}

OptionsScene nuzOptions(final Rules r) {
  OptionsScene o = new OptionsScene("REGLAS NUZLOCKE");
  o.rows.add(tog("Sólo la primera captura de cada zona", "Si lo desactivas puedes capturar todos los Pokémon que quieras.", new IntGet() { public int get() { return r.firstEncounterOnly ? 1 : 0; } }, new IntCb() { public void run(int v) { r.firstEncounterOnly = v == 1; } }));
  o.rows.add(tog("Cláusula de duplicados", "El primer encuentro de una zona nunca es una especie (o línea evolutiva) que ya tengas.", new IntGet() { public int get() { return r.dupesClause ? 1 : 0; } }, new IntCb() { public void run(int v) { r.dupesClause = v == 1; } }));
  o.rows.add(tog("Los caídos mueren para siempre", "Si lo desactivas los Pokémon debilitados se curan normalmente (y si pierdes, vuelves al Centro).", new IntGet() { public int get() { return r.permadeath ? 1 : 0; } }, new IntCb() { public void run(int v) { r.permadeath = v == 1; } }));
  return o;
}

OptionsScene randomOptions(final Rules r) {
  OptionsScene o = new OptionsScene("PERSONALIZAR ALEATORIO");
  o.rows.add(tog("Iniciales aleatorios", "Los tres Pokémon para elegir al empezar serán aleatorios.", new IntGet() { public int get() { return r.randomStarters ? 1 : 0; } }, new IntCb() { public void run(int v) { r.randomStarters = v == 1; } }));
  o.rows.add(tog("Pokémon salvajes aleatorios", "Cualquier especie de cualquier generación puede aparecer en la hierba.", new IntGet() { public int get() { return r.randomWild ? 1 : 0; } }, new IntCb() { public void run(int v) { r.randomWild = v == 1; } }));
  o.rows.add(tog("Entrenadores y jefes aleatorios", "Los equipos de entrenadores, líderes, Alto Mando y rival se sustituyen por Pokémon aleatorios.", new IntGet() { public int get() { return r.randomTrainers ? 1 : 0; } }, new IntCb() { public void run(int v) { r.randomTrainers = v == 1; } }));
  o.rows.add(tog("Fuerza parecida a la original", "Sí: el Pokémon aleatorio tiene una fuerza (stats totales) parecida a la del original o a la que toca por nivel. No: puede salir cualquier cosa (¡un Magikarp de jefe o un Arceus en la ruta 1!).", new IntGet() { public int get() { return r.similarBst ? 1 : 0; } }, new IntCb() { public void run(int v) { r.similarBst = v == 1; } }));
  o.rows.add(cho("Habilidades", "ORIGINALES: las de cada especie. ALEATORIAS (todas): cada Pokémon recibe una habilidad al azar de las 318, incluso las que el juego no aplica. ALEATORIAS (con efecto): sólo habilidades que sí tienen efecto en combate (" + Effects.FUNCTIONAL.length + ").",
    new String[]{"Originales", "Aleatorias (todas)", "Aleatorias (con efecto)"}, new IntGet() { public int get() { return r.abilities; } }, new IntCb() { public void run(int v) { r.abilities = v; } }));
  o.rows.add(cho("Movimientos", "POR NIVEL: como el juego original. INTELIGENTES: movimientos aleatorios legales para esa especie, bien elegidos. TOTALMENTE ALEATORIOS: 4 movimientos cualquiera (al menos uno de daño), aunque no los aprenda.",
    new String[]{"Por nivel", "Aleatorios inteligentes", "Totalmente aleatorios"}, new IntGet() { public int get() { return r.moves; } }, new IntCb() { public void run(int v) { r.moves = v; } }));
  o.rows.add(cho("Legendarios", "NUNCA: no aparecen legendarios ni singulares. SEGÚN NIVEL: sólo a partir de cierto nivel. SIEMPRE: pueden aparecer en cualquier momento.",
    new String[]{"Nunca", "Según nivel", "Siempre"}, new IntGet() { public int get() { return r.legendaries; } }, new IntCb() { public void run(int v) { r.legendaries = v; } }));
  return o;
}

OptionsScene generalOptions(final Rules r) {
  OptionsScene o = new OptionsScene("REGLAS GENERALES");
  o.rows.add(tog("Tope de nivel", "Tus Pokémon no ganan experiencia por encima del nivel del as del próximo jefe.", new IntGet() { public int get() { return r.levelCap ? 1 : 0; } }, new IntCb() { public void run(int v) { r.levelCap = v == 1; } }));
  o.rows.add(tog("Objetos en combates de entrenador", "Si lo desactivas no puedes usar pociones ni objetos de la mochila contra entrenadores (sí contra salvajes).", new IntGet() { public int get() { return r.battleItems ? 1 : 0; } }, new IntCb() { public void run(int v) { r.battleItems = v == 1; } }));
  o.rows.add(tog("Preguntar apodo al capturar", "Al conseguir un Pokémon te pregunta si quieres ponerle apodo (también puedes hacerlo luego desde el Equipo).", new IntGet() { public int get() { return r.askNickname ? 1 : 0; } }, new IntCb() { public void run(int v) { r.askNickname = v == 1; } }));
  return o;
}

OptionsScene characterOptions(final NewSetup S) {
  final OptionsScene o = new OptionsScene("TU PERSONAJE");
  o.rows.add(actv("Tu nombre", "Cómo te llamas.", new StrGet() { public String get() { return S.pname; } }, new Cb() { public void run() {
    pushScene(new TextInputScene("¿Cómo te llamas?", S.pname, 10, new StrCb() { public void run(String s) { if (s != null && s.trim().length() > 0) S.pname = s.trim(); } })); } }));
  o.rows.add(actv("Nombre de tu rival", "Cómo se llama tu rival (el del laboratorio, la Calle Victoria y el Campeón).", new StrGet() { public String get() { return S.rname; } }, new Cb() { public void run() {
    pushScene(new TextInputScene("¿Cómo se llama tu rival?", S.rname, 10, new StrCb() { public void run(String s) { if (s != null && s.trim().length() > 0) S.rname = s.trim(); } })); } }));
  o.rows.add(cho("Gorra", "Color de tu gorra.", CAP_NAMES, new IntGet() { public int get() { return S.l0; } }, new IntCb() { public void run(int v) { S.l0 = v; } }));
  o.rows.add(cho("Camiseta", "Color de tu camiseta.", SHIRT_NAMES, new IntGet() { public int get() { return S.l1; } }, new IntCb() { public void run(int v) { S.l1 = v; } }));
  o.rows.add(cho("Pelo", "Color de tu pelo.", HAIR_NAMES, new IntGet() { public int get() { return S.l2; } }, new IntCb() { public void run(int v) { S.l2 = v; } }));
  o.visible = 5;
  o.extra = new Cb() { public void run() { drawTrainer(790, 300, 1.7f, S.l0, S.l1, S.l2); txtc(S.pname, 790, 26, fBig, color(255, 230, 140)); } };
  return o;
}

// =====================================================================
//  ENTRADA DE TEXTO (nombres y apodos)
// =====================================================================
class TextInputScene extends Scene {
  String prompt, text; int maxLen; StrCb cb;
  TextInputScene(String prompt, String initial, int maxLen, StrCb cb) { this.prompt = prompt; this.text = initial == null ? "" : initial; this.maxLen = maxLen; this.cb = cb; }
  boolean opaque() { return false; }
  void draw() {
    fill(0, 150); noStroke(); rect(0, 0, width, height);
    panel(180, 200, 600, 190);
    txt(prompt, 205, 214, fNormal, color(255, 230, 140));
    fill(10, 14, 28); rect(205, 262, 550, 50, 8);
    txt(text + ((tick / 25) % 2 == 0 ? "|" : ""), 220, 272, fBig, color(255));
    txt("Escribe con el teclado · Enter: aceptar · Retroceso: borrar · Esc: cancelar", 205, 330, fSmall, color(170));
    txt(text.length() + "/" + maxLen, 700, 330, fSmall, color(170));
  }
  void key(int k, char c) {
    if (c == ENTER || c == RETURN) { popScene(); if (cb != null) cb.run(text); }
    else if (c == ESC) { popScene(); if (cb != null) cb.run(null); }
    else if (c == BACKSPACE || c == DELETE) { if (text.length() > 0) text = text.substring(0, text.length() - 1); }
    else if (c != CODED && c >= 32 && c != 127 && text.length() < maxLen) text += c;
  }
}

/** Pregunta si se quiere apodo, lo pide y continúa. */
void askNick(final Mon m, final Cb after) {
  if (game == null || !game.rules.askNickname) { if (after != null) after.run(); return; }
  pushScene(new ConfirmScene("¿Quieres ponerle un apodo a " + m.normalSp.name + "?", new Cb() { public void run() {
    pushScene(new TextInputScene("Apodo de " + m.normalSp.name, "", 12, new StrCb() { public void run(String s) {
      if (s != null && s.trim().length() > 0) m.nick = s.trim();
      if (after != null) after.run();
    } }));
  } }, new Cb() { public void run() { if (after != null) after.run(); } }));
}

// =====================================================================
//  AYUDA / PREGUNTAS FRECUENTES
// =====================================================================
class HelpScene extends Scene {
  ArrayList<String> titles = new ArrayList<String>(), bodies = new ArrayList<String>();
  ListMenu m = new ListMenu();
  void add(String t, String b) { titles.add(t); bodies.add(b); }
  void enter() {
    add("¿Cómo se juega?", "Recorres Kanto zona a zona desde el mapa: entras en la hierba alta para combatir Pokémon salvajes (y capturarlos), desafías a los entrenadores de cada zona y derrotas al jefe (líder de gimnasio, rival o Alto Mando) para poder avanzar. Reúne las 8 medallas, supera la Calle Victoria y gana la Liga Pokémon.");
    add("Controles", "Flechas o W/A/S/D: moverte.  Z, Enter o Espacio: aceptar.  X, Retroceso o Esc: volver.\nEn combate: M = Megaevolución, G = Dinamax/Gigamax (se activan antes de elegir el movimiento).");
    add("Megaevolución", "Tu Pokémon debe llevar su piedra mega equipada (menú Equipo → Dar / quitar objeto). En combate pulsa M y elige un movimiento: se transforma y se queda así TODO el combate. Los jefes, los entrenadores y la tienda de Ciudad Azulona dan piedras mega. Sólo se puede usar una transformación (Mega O Dinamax) por combate y por bando.");
    add("Dinamax y Gigamax", "Cualquier Pokémon (salvo excepciones) puede Dinamaxear: pulsa G antes de elegir movimiento. Sus PS se multiplican por 1,5 y sus movimientos se convierten en Movimientos Max (o G-Max en las especies Gigamax). Los de estado pasan a ser Protección Max. Dura todo el combate, como la Mega.");
    add("Tipos, estados y clima", "Los tipos tienen ventajas y desventajas (muy eficaz ×2, poco eficaz ×0,5, inmune ×0). Estados: quemadura, parálisis, veneno, sueño, congelación, confusión. El clima (lluvia, sol, tormenta de arena, granizo) y los terrenos potencian o debilitan ataques. Las trampas (Trampa Rocas, Púas...) dañan al entrar.");
    add("Captura", "En combate contra un Pokémon salvaje abre la Mochila → Poké Balls. Cuanto menos PS tenga y si está dormido, paralizado, etc., más fácil. Las Ultra Ball y otras balls especiales ayudan. En combates de entrenador no se puede capturar.");
    add("Nuzlocke", "Sólo puedes capturar el primer Pokémon de cada zona (si lo debilitas o se escapa, pierdes la oportunidad) y los Pokémon que se debilitan mueren para siempre (van al Cementerio). Si no te queda ninguno vivo, termina la partida. Las reglas se pueden ajustar al empezar.");
    add("Modo aleatorio", "Se puede aleatorizar por separado: iniciales, Pokémon salvajes, entrenadores y jefes, habilidades (todas o sólo las que tienen efecto), movimientos (inteligentes o totalmente aleatorios) y legendarios. «Fuerza parecida» mantiene un equilibrio razonable entre lo que sustituye y lo original.");
    add("Dificultades", "NORMAL: IA sencilla, rivales 1 nivel menos, Mega/Dinamax sólo en jefes avanzados.  DIFÍCIL: IA que calcula daño y cambia a counters, jefes con Mega/Dinamax, EVs que crecen con tus medallas.  EXTREMO: rivales +3 niveles, EVs al máximo desde el inicio, todos pueden Megaevolucionar/Dinamaxear, captura más difícil.");
    add("Tope de nivel", "Tus Pokémon no ganan experiencia por encima del nivel del as del próximo jefe. Se puede desactivar en las reglas generales. El Caramelo Nivelador también lo respeta.");
    add("Taza y Caramelo Nivelador", "En el menú de cada Centro Pokémon hay una taza ☕. Al interactuar te da un Caramelo Nivelador: dáselo a un Pokémon desde la Mochila y subirá hasta el nivel PROMEDIO de tu equipo (con aprendizaje de movimientos y evolución). La taza se rellena una vez por Centro cada vez que consigues una medalla nueva.");
    add("Tienda y objetos", "Las tiendas venden pociones, balls, piedras evolutivas y vitaminas (más cosas según tus medallas). El Gran Almacén de Ciudad Azulona vende TODOS los objetos equipables y las piedras mega. Los entrenadores y jefes a veces dejan objetos.");
    add("Evolución", "Los Pokémon evolucionan al nivel indicado. Las evoluciones por piedra se hacen desde la Mochila (Mejoras / Piedras). Las que normalmente piden intercambio evolucionan al nivel 36, las de amistad al 26 y las de condición especial al 32. Un Piedra Eterna lo impide.");
    add("Apodos, personaje y Pokédex", "Puedes ponerle apodo a tus Pokémon al capturarlos o desde Equipo → elegirlo → Apodo. En la Pokédex, selecciona un Pokémon que hayas capturado para ver todos sus datos: movimientos por nivel, otros movimientos, evolución y formas.");
    add("Guardado", "Elige «Guardar partida» en el menú del mapa. El archivo save.txt queda junto al juego. Con «Continuar» en el título la recuperas, con todas tus reglas.");
    add("Qué falta (limitaciones)", "El motor de combate es propio: los movimientos de daño funcionan todos, pero sólo parte de los movimientos de estado, ~210 habilidades y los objetos de uso común tienen efecto real. Combates 1 contra 1. Los sprites se descargan al jugar (hace falta internet) y se guardan en la carpeta data/sprites.");
    if (game != null) add("Tus reglas actuales", rulesSummary(game.rules));
    ArrayList<String> l = new ArrayList<String>(titles);
    m.set(l); m.visible = 12;
  }
  void draw() {
    background(16, 20, 32);
    txt("Ayuda · Preguntas frecuentes", 40, 14, fBig, color(255, 220, 120));
    panel(40, 66, 330, 548);
    m.draw(48, 76, 314, 42);
    panel(390, 66, 530, 548);
    if (m.sel < bodies.size()) {
      txt(titles.get(m.sel), 406, 78, fNormal, color(255, 230, 140));
      textFont(fSmall); fill(225); textAlign(LEFT, TOP); text(bodies.get(m.sel), 406, 118, 498, 480);
    }
    txt("X: volver", 40, height - 24, fSmall, color(150));
  }
  void key(int k, char c) { if (m.move(k)) return; if (k == K_BACK || k == K_OK) popScene(); }
}

String rulesSummary(Rules r) {
  String s = "Dificultad: " + r.difficultyName() + ".\n";
  s += "Tope de nivel: " + (r.levelCap ? "sí" : "no") + ".  Objetos en combate de entrenador: " + (r.battleItems ? "sí" : "no") + ".\n";
  s += "Nuzlocke: " + (r.nuzlocke ? "sí (primera captura: " + (r.firstEncounterOnly ? "sí" : "no") + ", duplicados: " + (r.dupesClause ? "sí" : "no") + ", muerte permanente: " + (r.permadeath ? "sí" : "no") + ")" : "no") + ".\n";
  s += "Aleatorio — iniciales: " + (r.randomStarters ? "sí" : "no") + ", salvajes: " + (r.randomWild ? "sí" : "no") + ", entrenadores: " + (r.randomTrainers ? "sí" : "no") + ", fuerza parecida: " + (r.similarBst ? "sí" : "no") + ".\n";
  s += "Habilidades: " + new String[]{"originales", "aleatorias (todas)", "aleatorias (con efecto)"}[r.abilities] + ".  Movimientos: " + new String[]{"por nivel", "aleatorios inteligentes", "totalmente aleatorios"}[r.moves] + ".  Legendarios: " + new String[]{"nunca", "según nivel", "siempre"}[r.legendaries] + ".";
  return s;
}

// =====================================================================
//  POKÉDEX COMPLETA (detalle de una especie)
// =====================================================================
boolean dexKnown(Species s) {
  if (game.caught.contains(s.id)) return true;
  Species base = Dex.byName.get(Dex.toId(s.baseSpecies));
  return base != null && game.caught.contains(base.id);
}

String evoText(Evo e) {
  String t;
  if (e.type.equals("useItem")) t = "con " + Items.name(e.item);
  else if (e.type.equals("trade")) t = "por intercambio" + (e.item.isEmpty() ? "" : " con " + Items.name(e.item));
  else if (e.type.equals("levelFriendship")) t = "con amistad alta";
  else t = e.level > 0 ? "al nivel " + e.level : "";
  if (!e.cond.isEmpty()) t += (t.isEmpty() ? "" : " · ") + e.cond;
  if (!e.move.isEmpty()) t += (t.isEmpty() ? "" : " · ") + "conociendo " + e.move;
  return t.isEmpty() ? "(condición especial)" : t;
}

class DexDetailScene extends Scene {
  Species s; boolean known; int page = 0; int scroll = 0;
  String[] pageNames = {"Datos", "Movimientos por nivel", "Otros movimientos", "Evolución y formas"};
  ArrayList<String> otherMoves = new ArrayList<String>();
  DexDetailScene(Species s) {
    this.s = s; known = dexKnown(s);
    for (String id : s.otherMoves) otherMoves.add(id);
    java.util.Collections.sort(otherMoves);
  }
  void draw() {
    background(16, 20, 32);
    panel(20, 16, 920, 608);
    drawCreature(s, 120, 150, 78, false, false, false, known ? 255.0f : 90.0f);
    txt("#" + nf(s.num, 4) + "  " + (known ? s.name : "???"), 230, 24, fBig, color(255, 230, 140));
    if (known) { typeChip(s.t1, 230, 68); if (!s.t2.isEmpty()) typeChip(s.t2, 314, 68); }
    txt(known ? pageNames[page] : "Pokémon no capturado", 230, 98, fNormal, color(180, 220, 255));
    for (int i = 0; i < 4; i++) { fill(i == page ? color(255, 220, 120) : color(90)); ellipse(660 + i * 22, 42, 12, 12); }
    if (!known) { txt("Captura este Pokémon (o a su forma base) para ver todos sus datos.", 40, 260, fNormal, color(210)); txt("←/→: página · X: volver", 40, 590, fSmall, color(150)); return; }
    if (page == 0) drawInfo();
    else if (page == 1) drawLevelMoves();
    else if (page == 2) drawOtherMoves();
    else drawEvos();
    txt("←/→: página · ↑/↓: desplazar · X: volver", 40, 596, fSmall, color(150));
  }
  void drawInfo() {
    String[] nm = {"PS", "Ataque", "Defensa", "At. Esp.", "Def. Esp.", "Velocidad"};
    for (int i = 0; i < 6; i++) {
      float y = 150 + i * 30;
      txt(nm[i], 40, y, fNormal, color(230)); txt("" + s.base[i], 170, y, fNormal, color(255));
      fill(60); rect(230, y + 6, 240, 12, 6); fill(typeColor(i % 2 == 0 ? s.t1 : (s.t2.isEmpty() ? s.t1 : s.t2))); rect(230, y + 6, constrain(s.base[i] / 255.0f, 0, 1) * 240, 12, 6);
    }
    txt("Total base: " + s.bst() + "    Peso: " + s.weight + " kg", 40, 340, fNormal, color(210));
    String fl = (s.mega ? "Megaevolución. " : "") + (s.primal ? "Regresión primigenia. " : "") + (s.gmax ? "Forma Gigamax. " : "") + (s.noDmax ? "No puede Dinamaxear. " : "") + (s.legendary() ? "Legendario/singular. " : "");
    if (!fl.isEmpty()) txt(fl, 40, 372, fSmall, color(255, 220, 120));
    String[] ab = s.abilities; float y = 410;
    for (int i = 0; i < 3; i++) {
      if (ab[i].isEmpty()) continue;
      AbilityDef d = Dex.ab(ab[i]);
      txt((i == 2 ? "Oculta: " : "Habilidad: ") + (d != null ? d.dn() : ab[i]), 40, y, fNormal, color(255, 220, 140));
      if (d != null) { textFont(fSmall); fill(205); textAlign(LEFT, TOP); text(d.dd(), 60, y + 26, 860, 40); }
      y += 62;
    }
  }
  void drawLevelMoves() {
    int n = s.learnMove.length; int rows = 13;
    scroll = constrain(scroll, 0, max(0, n - rows));
    txt("Nv", 40, 130, fSmall, color(170)); txt("Movimiento", 100, 130, fSmall, color(170)); txt("Tipo", 420, 130, fSmall, color(170)); txt("Clase", 520, 130, fSmall, color(170)); txt("Pot", 620, 130, fSmall, color(170)); txt("Prec", 690, 130, fSmall, color(170));
    for (int i = 0; i < rows && scroll + i < n; i++) {
      int idx = scroll + i; Move m = Dex.mv(s.learnMove[idx]); float y = 154 + i * 32;
      if (m == null) continue;
      txt(s.learnLvl[idx] == 0 ? "—" : "" + s.learnLvl[idx], 40, y, fNormal, color(255, 230, 140));
      txt(m.dn(), 100, y, fNormal, m.supported ? color(240) : color(150));
      typeChip(m.type, 420, y + 2);
      txt(m.cat == 'P' ? "Físico" : m.cat == 'S' ? "Especial" : "Estado", 520, y + 2, fSmall, color(210));
      txt(m.bp > 0 ? "" + m.bp : "—", 620, y + 2, fSmall, color(210)); txt(m.acc > 0 ? "" + m.acc : "—", 690, y + 2, fSmall, color(210));
    }
    if (n == 0) txt("Este Pokémon no aprende movimientos por nivel.", 40, 160, fNormal, color(200));
    txtr(n == 0 ? "" : (scroll + 1) + "–" + min(n, scroll + rows) + " / " + n, 920, 100, fSmall, color(170));
  }
  void drawOtherMoves() {
    int n = otherMoves.size(); int cols = 3, rows = 14;
    scroll = constrain(scroll, 0, max(0, (n + cols - 1) / cols - rows));
    txt("MT, tutores, huevo y otros (en gris: sin efecto en este juego)", 40, 126, fSmall, color(170));
    for (int i = 0; i < rows * cols; i++) {
      int idx = scroll * cols + i; if (idx >= n) break;
      Move m = Dex.mv(otherMoves.get(idx)); if (m == null) continue;
      float x = 40 + (i % cols) * 296, y = 154 + (i / cols) * 30;
      fill(typeColor(m.type)); rect(x, y + 4, 6, 20, 3);
      txt(m.dn(), x + 14, y, fSmall, m.supported ? color(240) : color(140));
    }
    txtr(n + " movimientos", 920, 100, fSmall, color(170));
  }
  void drawEvos() {
    float y = 130;
    if (!s.prevo.isEmpty()) { txt("Evoluciona de: " + s.prevo, 40, y, fNormal, color(255)); y += 34; }
    for (Evo e : s.evos) { txt("→ " + e.to + "  " + evoText(e), 40, y, fNormal, color(180, 240, 180)); y += 34; }
    if (s.prevo.isEmpty() && s.evos.isEmpty()) { txt("No evoluciona.", 40, y, fNormal, color(200)); y += 34; }
    y += 14; txt("Formas relacionadas", 40, y, fNormal, color(255, 220, 120)); y += 34;
    Species base = Dex.byName.get(Dex.toId(s.baseSpecies)); if (base == null) base = s;
    for (Species o : Dex.species.values()) {
      if (o == s || o.cosmetic) continue;
      Species ob = Dex.byName.get(Dex.toId(o.baseSpecies));
      if (ob != base && o != base) continue;
      String t = o.name + (o.mega ? "  (Mega" + (o.reqItems.length > 0 ? ", con " + Items.name(o.reqItems[0]) : "") + ")" : o.gmax ? "  (Gigamax)" : o.primal ? "  (Primigenia)" : o.battleOnly ? "  (en combate)" : "");
      if (y < 560) { txt("• " + t, 60, y, fSmall, color(225)); y += 26; }
    }
  }
  void key(int k, char c) {
    if (k == K_LEFT) { page = (page + 3) % 4; scroll = 0; }
    else if (k == K_RIGHT) { page = (page + 1) % 4; scroll = 0; }
    else if (k == K_UP) scroll = max(0, scroll - 1);
    else if (k == K_DOWN) scroll++;
    else if (k == K_BACK) popScene();
  }
}
