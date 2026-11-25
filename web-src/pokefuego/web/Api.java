package pokefuego.web;

import pokefuego.engine.*;
import java.util.*;

/** Fachada del motor para la interfaz web: todo entra por call(método, args) y sale como JSON. */
public class Api {
  static Game game;
  static Battle battle;
  static final String SEP = "\u0001";

  // ------------------------------------------------------------ JSON mínimo
  static String q(String s) {
    if (s == null) return "\"\"";
    StringBuilder b = new StringBuilder("\"");
    for (int i = 0; i < s.length(); i++) {
      char c = s.charAt(i);
      if (c == '"') b.append("\\\""); else if (c == '\\') b.append("\\\\"); else if (c == '\n') b.append("\\n");
      else if (c == '\r') { } else if (c == '\t') b.append("\\t"); else if (c < 32) b.append(' '); else b.append(c);
    }
    return b.append('"').toString();
  }
  static class O {
    StringBuilder s = new StringBuilder("{"); boolean first = true;
    O add(String k, String raw) { if (!first) s.append(','); first = false; s.append(q(k)).append(':').append(raw); return this; }
    O p(String k, String v) { return add(k, q(v)); }
    O p(String k, int v) { return add(k, "" + v); }
    O p(String k, boolean v) { return add(k, v ? "true" : "false"); }
    O p(String k, double v) { return add(k, "" + v); }
    public String toString() { return s.append('}').toString(); }
  }
  static String arr(List<String> items) {
    StringBuilder b = new StringBuilder("[");
    for (int i = 0; i < items.size(); i++) { if (i > 0) b.append(','); b.append(items.get(i)); }
    return b.append(']').toString();
  }
  static String strArr(String... v) { List<String> l = new ArrayList<String>(); for (String x : v) l.add(q(x)); return arr(l); }
  static String intArr(int... v) { List<String> l = new ArrayList<String>(); for (int x : v) l.add("" + x); return arr(l); }

  // ------------------------------------------------------------ entrada
  public static String call(String m, String raw) {
    String[] a = raw.isEmpty() ? new String[0] : raw.split(SEP, -1);
    try { return dispatch(m, a); }
    catch (Throwable t) { return new O().p("error", String.valueOf(t) + " en " + m).toString(); }
  }

  static int I(String[] a, int i) { return Integer.parseInt(a[i]); }
  static boolean B(String[] a, int i) { return a[i].equals("1") || a[i].equals("true"); }
  static String ok() { return "{\"ok\":true}"; }
  static String fail(String msg) { return new O().p("ok", false).p("msg", msg).toString(); }

  static String dispatch(String m, String[] a) {
    switch (m) {
      case "init": return init(a);
      case "newGame": {
        Rules r = Rules.parse(a[0]);
        game = new Game(r, System.currentTimeMillis());
        game.playerName = a[1]; game.rivalName = a[2]; game.look0 = I(a, 3); game.look1 = I(a, 4); game.look2 = I(a, 5);
        game.applyNames();
        return ok();
      }
      case "starters": {
        List<String> l = new ArrayList<String>();
        for (String id : game.starterChoices()) { Species s = Dex.sp(id); l.add(new O().p("id", s.id).p("name", s.name).p("sk", sk(s)).p("num", s.num).add("types", strArr(s.t1, s.t2)).p("bst", s.bst()).p("ability", abName(s.abilities[0])).p("base", s.baseSpecies).p("forme", s.forme).toString()); }
        return arr(l);
      }
      case "chooseStarter": game.chooseStarter(a[0]); return ok();
      case "game": return gameJson();
      case "save": { StringBuilder b = new StringBuilder(); for (String l : game.serialize()) b.append(l).append('\n'); return q(b.toString()); }
      case "load": {
        List<String> lines = new ArrayList<String>(); for (String l : a[0].split("\n")) if (!l.isEmpty()) lines.add(l);
        Game g = Game.deserialize(lines);
        if (g == null) return fail("Partida no válida");
        game = g; return ok();
      }
      case "party": { List<String> l = new ArrayList<String>(); for (int i = 0; i < game.party.size(); i++) l.add(monJson(game.party.get(i), i)); return arr(l); }
      case "box": { List<String> l = new ArrayList<String>(); for (int i = 0; i < game.box.size(); i++) l.add(monJson(game.box.get(i), i)); return arr(l); }
      case "graveyard": { List<String> l = new ArrayList<String>(); for (int i = 0; i < game.graveyard.size(); i++) l.add(monJson(game.graveyard.get(i), i)); return arr(l); }
      case "swapParty": { int i = I(a, 0), j = I(a, 1); Mon x = game.party.get(i); game.party.set(i, game.party.get(j)); game.party.set(j, x); return ok(); }
      case "toBox": { int i = I(a, 0); if (game.party.size() <= 1) return fail("No puedes dejar el equipo vacío."); game.box.add(game.party.remove(i)); return ok(); }
      case "fromBox": {
        int i = I(a, 0); Mon mo = game.box.get(i);
        if (!mo.alive() && game.rules.nuzlocke) return fail("Ese Pokémon está caído.");
        if (game.party.size() >= 6) return fail("El equipo está completo."); game.box.remove(i); game.party.add(mo); return ok();
      }
      case "swapBox": { int pi = I(a, 0), bi = I(a, 1); Mon out = game.party.get(pi); game.party.set(pi, game.box.get(bi)); game.box.set(bi, out); return ok(); }
      case "nick": game.party.get(I(a, 0)).nick = a[1].trim(); return ok();
      case "nickAny": { // apodo por origen: 0 equipo, 1 caja
        Mon mo = I(a, 0) == 0 ? game.party.get(I(a, 1)) : game.box.get(I(a, 1)); mo.nick = a[2].trim(); return ok(); }
      case "give": {
        Mon mo = game.party.get(I(a, 0)); String id = a[1];
        if (game.bag.count(id) < 1) return fail("No tienes ese objeto.");
        if (!mo.item.isEmpty()) game.bag.add(mo.item, 1);
        game.bag.remove(id, 1); mo.item = id; mo.checkItemForme(); return ok();
      }
      case "take": { Mon mo = game.party.get(I(a, 0)); if (!mo.item.isEmpty()) { game.bag.add(mo.item, 1); mo.item = ""; mo.checkItemForme(); } return ok(); }
      case "bag": return bagJson();
      case "useItem": return useItem(a[0], I(a, 1));
      case "evolve": { Mon mo = game.party.get(I(a, 0)); mo.evolveTo(Dex.sp(a[1])); game.own(mo); return monJson(mo, I(a, 0)); }
      case "learn": { Mon mo = game.party.get(I(a, 0)); mo.learnMove(a[1], I(a, 2)); return ok(); }
      case "healAll": game.healAll(); return ok();
      case "cupAvail": return new O().p("avail", game.cupAvailable()).p("avg", game.avgLevel()).toString();
      case "cupTake": return new O().p("ok", game.takeFromCup()).p("avg", game.avgLevel()).toString();
      case "shopStock": {
        List<String> l = new ArrayList<String>();
        for (String id : game.shopStock(I(a, 0))) l.add(itemRow(id, game.priceOf(id)));
        return arr(l);
      }
      case "buy": return new O().p("ok", game.buy(a[0], I(a, 1))).p("money", game.money).toString();
      case "setPlace": game.placeIdx = I(a, 0); return ok();
      case "placeInfo": return placeJson(I(a, 0));
      case "advanceInfo": {
        Trainer nb = game.nextBoss();
        return new O().p("canAdvance", game.canAdvance()).p("boss", nb == null ? "" : nb.full()).toString();
      }
      case "dexList": return dexList();
      case "dexDetail": return dexDetail(a[0]);
      case "spriteKeys": { // [num, clave] de las especies base 1-386 (para importar del ROM)
        List<String> l = new ArrayList<String>();
        for (Species s : Dex.species.values()) if (s.num >= 1 && s.num <= 386 && s.forme.isEmpty() && !s.mega && !s.gmax && !s.cosmetic && !s.primal) l.add("[" + s.num + "," + q(sk(s)) + "," + q(s.id) + "]");
        return arr(l);
      }
      case "formKey": return q(formKey(a[0], I(a, 1), a[2], a[3], a[4]));
      // ---- depuración / pruebas ----
      case "dbgMon": { Mon dm = Mon.create(Dex.sp(a[0]), I(a, 1), game.rng); dm.setMoves(MoveGen.smartSet(dm.normalSp, I(a, 1), game.rng)); if (a.length > 2) { dm.item = a[2]; dm.checkItemForme(); } game.own(dm); if (game.party.size() < 6) game.party.add(dm); else game.box.add(dm); return ok(); }
      case "dbgBag": game.bag.add(a[0], I(a, 1)); return ok();
      case "dbgBadges": game.badges = I(a, 0); return ok();
      case "dbgMoney": game.money = I(a, 0); return ok();
      case "functionalCount": return "" + Effects.FUNCTIONAL.length;
      // ---- combate ----
      case "wildBattle": { battle = game.wildBattle(); battle.start(); return ok(); }
      case "trainerBattle": {
        game.placeIdx = I(a, 0); int ti = I(a, 1);
        Trainer t = ti < 0 ? game.nextBoss() : game.place().trainers.get(ti);
        if (t == null) return fail("No hay entrenador.");
        battle = game.trainerBattle(t); battle.start(); return ok();
      }
      case "bState": return battleJson();
      case "bEvents": return eventsJson();
      case "bForced": {
        Mon u = battle.sides[0].active;
        boolean f = !u.chargingMove.isEmpty() || u.recharge > 0 || (u.lockTurns > 0 && !u.lockedMove.isEmpty() && !u.dynamaxed) || battle.mustStruggle(u);
        return f ? "true" : "false";
      }
      case "bTurn": {
        int type = I(a, 0);
        Action act;
        if (type == Action.MOVE) act = Action.move(I(a, 1), B(a, 2), B(a, 3));
        else if (type == Action.SWITCH) act = Action.sw(I(a, 1));
        else if (type == Action.ITEM) act = Action.item(a[4], I(a, 1));
        else if (type == Action.BALL) act = Action.ball(a[4]);
        else act = Action.run();
        if (type == Action.SWITCH && !battle.canSwitch(battle.sides[0])) return fail("¡No puedes cambiar: estás atrapado!");
        if (type == Action.ITEM && !battle.wild && !game.rules.battleItems) return fail("Reglas: no se pueden usar objetos contra entrenadores.");
        Action e = AI.choose(battle, 1, !battle.wild && game.rules.hardAI());
        battle.turn(act, e);
        return ok();
      }
      case "bReplace": battle.replace(I(a, 0), I(a, 1)); return ok();
      case "bAiReplace": {
        int r = AI.bestReplacement(battle, 1);
        if (r < 0) { battle.needSwitch[1] = false; battle.checkOver(); } else battle.replace(1, r);
        return ok();
      }
      case "bFinish": return finishJson();
      default: return new O().p("error", "método desconocido: " + m).toString();
    }
  }

  // ------------------------------------------------------------ datos
  static String init(String[] a) {
    final Map<String, String[]> files = new HashMap<String, String[]>();
    String[] names = {"species.tsv", "moves.tsv", "abilities.tsv", "items.tsv", "learnsets.tsv", "types.tsv", "es_moves.tsv", "es_abilities.tsv", "es_items.tsv"};
    for (int i = 0; i < names.length && i < a.length; i++) {
      List<String> l = new ArrayList<String>();
      for (String ln : a[i].split("\n")) { if (ln.endsWith("\r")) ln = ln.substring(0, ln.length() - 1); l.add(ln); }
      files.put(names[i], l.toArray(new String[0]));
    }
    Dex.load(new DataLoader() { public String[] lines(String f) { String[] l = files.get(f); return l == null ? new String[0] : l; } });
    return new O().p("species", Dex.species.size()).p("moves", Dex.moves.size()).p("abilities", Dex.abilities.size()).p("items", Dex.items.size()).p("functional", Effects.FUNCTIONAL.length).toString();
  }

  /** Clave de sprite (la misma que usa el juego para sus archivos f_/b_): base-forma. */
  static String sk(Species s) {
    String b = Dex.toId(s.baseSpecies), f = Dex.toId(s.forme);
    return f.isEmpty() ? b : b + "-" + f;
  }
  static String skOf(String sid) { Species s = Dex.species.get(sid); return s == null ? sid : sk(s); }

  static String abName(String n) { AbilityDef d = Dex.ab(n); return d == null ? n : d.dn(); }

  static String moveJson(Move mv, int pp, int maxPp) {
    if (mv == null) return "null";
    return new O().p("id", mv.id).p("name", mv.dn()).p("type", mv.type).p("cat", "" + mv.cat).p("bp", mv.bp).p("acc", mv.acc).p("pp", pp).p("maxPp", maxPp).p("desc", mv.dd()).p("supported", mv.supported).toString();
  }

  static String monJson(Mon m, int idx) {
    O o = new O();
    o.p("i", idx).p("id", m.normalSp.id).p("sid", m.sp.id).p("sk", sk(m.sp)).p("species", m.normalSp.name).p("name", m.name()).p("nick", m.nick).p("num", m.sp.num)
     .p("level", m.level).p("exp", m.exp).p("expNext", Mon.expFor(Math.min(100, m.level + 1))).p("hp", m.hp).p("maxHp", m.maxHp).p("status", m.status)
     .add("stats", intArr(m.maxHp, m.stat[1], m.stat[2], m.stat[3], m.stat[4], m.stat[5]))
     .add("base", intArr(m.sp.base[0], m.sp.base[1], m.sp.base[2], m.sp.base[3], m.sp.base[4], m.sp.base[5]))
     .add("ev", intArr(m.ev[0], m.ev[1], m.ev[2], m.ev[3], m.ev[4], m.ev[5]))
     .add("types", strArr(m.sp.t1, m.sp.t2)).p("nature", m.natureName()).p("dead", m.dead).p("alive", m.alive()).p("origin", m.origin);
    AbilityDef ab = Dex.ab(m.ability);
    o.add("ability", new O().p("name", ab == null ? m.ability : ab.dn()).p("desc", ab == null ? "" : ab.dd()).toString());
    o.add("item", m.item.isEmpty() ? "null" : new O().p("id", Dex.toId(m.item)).p("name", Items.name(m.item)).p("desc", Items.desc(m.item)).toString());
    List<String> mv = new ArrayList<String>();
    for (int i = 0; i < m.moves.length; i++) mv.add(moveJson(Dex.mv(m.moves[i]), m.pp[i], m.maxPp[i]));
    o.add("moves", arr(mv));
    Species mega = m.megaForm();
    o.p("mega", mega == null ? "" : mega.name).p("canDmax", m.canDynamax()).p("gmax", m.gmaxForm() != null);
    List<String> ev = new ArrayList<String>();
    for (Evo e : m.normalSp.evos) ev.add(new O().p("to", e.to).p("type", e.type).p("level", Mon.evoLevel(e)).p("item", e.item).toString());
    o.add("evos", arr(ev));
    return o.toString();
  }

  static String itemRow(String id, int price) {
    ItemDef d = Dex.items.get(Dex.toId(id));
    return new O().p("id", Dex.toId(id)).p("name", Items.name(id)).p("desc", Items.desc(id)).p("price", price).p("count", game.bag.count(id)).p("ball", Items.isBall(id)).p("mega", d != null && !d.megaStone.isEmpty()).toString();
  }

  static String bagJson() {
    List<String> l = new ArrayList<String>();
    for (String id : game.bag.ids()) {
      Consumable c = Items.CONS.get(id); ItemDef d = Dex.items.get(id);
      String tab;
      if (c != null) tab = (c.kind.equals("candy") || c.kind.equals("ev")) ? "upgrade" : "med";
      else if (d != null && d.ball) tab = "ball";
      else if (d != null && (!d.megaStone.isEmpty() || id.equals("redorb") || id.equals("blueorb"))) tab = "mega";
      else if (d != null && d.id.endsWith("stone") && !d.id.equals("everstone") && !d.id.equals("floatstone")) tab = "upgrade";
      else tab = "held";
      l.add(new O().p("id", id).p("name", Items.name(id)).p("desc", Items.desc(id)).p("count", game.bag.count(id)).p("tab", tab).p("battle", Items.usableInBattle(id)).p("ball", Items.isBall(id)).p("price", Items.price(id)).toString());
    }
    return arr(l);
  }

  static String learnEvolveJson(String msg, boolean ok, List<Object[]> learn, List<Object[]> evolve) {
    List<String> l = new ArrayList<String>(), e = new ArrayList<String>();
    for (Object[] x : learn) { Mon mo = (Mon) x[0]; Move mv = Dex.mv((String) x[1]); l.add("[" + game.party.indexOf(mo) + "," + q((String) x[1]) + "," + q(mv == null ? "" : mv.dn()) + "]"); }
    for (Object[] x : evolve) { Mon mo = (Mon) x[0]; Species s = (Species) x[1]; e.add("[" + game.party.indexOf(mo) + "," + q(s.id) + "," + q(s.name) + "]"); }
    return new O().p("ok", ok).p("msg", msg).add("learn", arr(l)).add("evolve", arr(e)).toString();
  }

  static String useItem(String id, int pi) {
    Mon mo = game.party.get(pi);
    id = Dex.toId(id);
    List<Object[]> learn = new ArrayList<Object[]>(), evolve = new ArrayList<Object[]>();
    if (game.bag.count(id) < 1) return fail("No tienes ese objeto.");
    if (id.equals("levelcandy")) {
      Game.Result r = game.useLevelCandy(mo);
      if (r == null) return fail("No tendrá efecto: " + mo.name() + " ya está en el nivel promedio (" + game.avgLevel() + ") o en el tope (" + game.levelCap() + ").");
      game.bag.remove(id, 1);
      return learnEvolveJson(r.msgs.get(0), true, r.learn, r.evolve);
    }
    if (id.equals("rarecandy")) {
      if (mo.level >= game.levelCap() || mo.level >= 100) return fail("Tope de nivel alcanzado.");
      game.bag.remove(id, 1);
      mo.level++; mo.exp = Math.max(mo.exp, Mon.expFor(mo.level)); mo.recalc(false);
      for (String mv : mo.newMovesAt(mo.level)) learn.add(new Object[]{mo, mv});
      Evo e = mo.checkEvolution(false);
      if (e != null) { Species to = Dex.sp(e.to); if (to != null) evolve.add(new Object[]{mo, to}); }
      return learnEvolveJson(mo.name() + " subió al nivel " + mo.level + ".", true, learn, evolve);
    }
    ItemDef d = Dex.items.get(id);
    if (d != null && d.id.endsWith("stone") && d.megaStone.isEmpty() && !d.id.equals("everstone") && !d.id.equals("floatstone")) {
      Evo e = mo.itemEvolution(id);
      if (e == null) return fail("No tendrá ningún efecto.");
      Species to = Dex.sp(e.to); game.bag.remove(id, 1);
      if (to != null) evolve.add(new Object[]{mo, to});
      return learnEvolveJson("¡" + mo.name() + " reacciona a la piedra!", true, learn, evolve);
    }
    String r = Items.useOnMon(null, mo, id, false);
    if (r.startsWith("No tendrá")) return fail(r);
    game.bag.remove(id, 1);
    return learnEvolveJson(r, true, learn, evolve);
  }

  static String gameJson() {
    Rules r = game.rules;
    O o = new O();
    o.p("rules", r.serialize()).p("player", game.playerName).p("rival", game.rivalName).add("look", intArr(game.look0, game.look1, game.look2))
     .p("placeIdx", game.placeIdx).p("money", game.money).p("badges", game.badges).p("gameOver", game.gameOver).p("champion", game.champion)
     .p("levelCap", game.levelCap()).p("avgLevel", game.avgLevel()).p("partySize", game.party.size()).p("boxSize", game.box.size()).p("deadSize", game.graveyard.size())
     .p("battlesWon", game.battlesWon).p("caught", game.caught.size()).p("seen", game.dex.size()).p("places", game.places.size()).p("difficulty", r.difficultyName())
     .p("isRandom", r.isRandom()).p("nuz", r.nuzlocke).p("cupAvailable", game.cupAvailable());
    return o.toString();
  }

  static String placeJson(int idx) {
    Place p = game.places.get(idx);
    List<String> ts = new ArrayList<String>();
    for (int i = 0; i < p.trainers.size(); i++) { Trainer t = p.trainers.get(i); ts.add(new O().p("i", i).p("name", t.full()).p("cls", t.cls).p("done", t.done).toString()); }
    O o = new O();
    o.p("idx", idx).p("name", p.name).p("desc", p.desc).p("minLv", p.minLv).p("maxLv", p.maxLv).add("theme", p.theme == null ? "[]" : strArr(p.theme))
     .p("center", p.center).p("shop", p.shop).p("bigShop", p.bigShop).p("megaShop", p.megaShop).p("encounterUsed", p.encounterUsed).add("trainers", arr(ts));
    if (p.boss != null) {
      Trainer nb = null;
      if (!p.bossChain.isEmpty()) { for (Trainer t : p.bossChain) if (!t.done) { nb = t; break; } } else if (!p.boss.done) nb = p.boss;
      List<String> ch = new ArrayList<String>();
      for (Trainer t : p.bossChain) ch.add(new O().p("key", t.key).p("name", t.full()).p("done", t.done).toString());
      o.add("chain", arr(ch));
      o.add("boss", new O().p("name", p.boss.full()).p("badge", p.boss.badge).p("done", game.allBossDone(p)).p("next", nb == null ? "" : nb.full()).p("nextKey", nb == null ? "" : nb.key).toString());
    } else o.add("boss", "null");
    return o.toString();
  }

  // ------------------------------------------------------------ Pokédex
  static String dexList() {
    List<String> l = new ArrayList<String>();
    List<Species> all = new ArrayList<Species>();
    for (Species s : Dex.species.values()) if (!s.cosmetic) all.add(s);
    Collections.sort(all, new Comparator<Species>() { public int compare(Species x, Species y) { return x.num != y.num ? x.num - y.num : x.name.compareTo(y.name); } });
    for (Species s : all) l.add("[" + q(s.id) + "," + s.num + "," + q(s.name) + "," + (game.dex.contains(s.id) ? 1 : 0) + "," + (game.caught.contains(s.id) ? 1 : 0) + "," + q(sk(s)) + "]");
    return arr(l);
  }

  static String dexDetail(String id) {
    Species s = Dex.species.get(id);
    if (s == null) return fail("Especie desconocida");
    Species base = Dex.byName.get(Dex.toId(s.baseSpecies));
    boolean known = game.caught.contains(s.id) || (base != null && game.caught.contains(base.id));
    O o = new O();
    o.p("id", s.id).p("name", s.name).p("num", s.num).p("base", s.baseSpecies).p("forme", s.forme).p("known", known).p("seen", game.dex.contains(s.id))
     .add("types", strArr(s.t1, s.t2)).add("stats", intArr(s.base[0], s.base[1], s.base[2], s.base[3], s.base[4], s.base[5])).p("bst", s.bst()).p("weight", s.weight)
     .p("sk", sk(s)).p("mega", s.mega).p("primal", s.primal).p("gmax", s.gmax).p("noDmax", s.noDmax).p("legendary", s.legendary());
    if (!known) return o.toString();
    List<String> ab = new ArrayList<String>();
    for (int i = 0; i < 3; i++) if (!s.abilities[i].isEmpty()) { AbilityDef d = Dex.ab(s.abilities[i]); ab.add(new O().p("name", d == null ? s.abilities[i] : d.dn()).p("desc", d == null ? "" : d.dd()).p("hidden", i == 2).toString()); }
    o.add("abilities", arr(ab));
    List<String> lv = new ArrayList<String>();
    for (int i = 0; i < s.learnMove.length; i++) { Move mv = Dex.mv(s.learnMove[i]); if (mv != null) lv.add("[" + s.learnLvl[i] + "," + q(mv.dn()) + "," + q(mv.type) + "," + q("" + mv.cat) + "," + mv.bp + "," + mv.acc + "," + (mv.supported ? 1 : 0) + "]"); }
    o.add("level", arr(lv));
    List<String> ot = new ArrayList<String>(); List<String> om = new ArrayList<String>(Arrays.asList(s.otherMoves)); Collections.sort(om);
    for (String mid : om) { Move mv = Dex.mv(mid); if (mv != null) ot.add("[" + q(mv.dn()) + "," + q(mv.type) + "," + (mv.supported ? 1 : 0) + "]"); }
    o.add("other", arr(ot));
    List<String> ev = new ArrayList<String>();
    for (Evo e : s.evos) ev.add(new O().p("to", e.to).p("type", e.type).p("level", e.level).p("item", e.item).p("itemName", e.item.isEmpty() ? "" : Items.name(e.item)).p("cond", e.cond).p("move", e.move).toString());
    o.add("evos", arr(ev)).p("prevo", s.prevo);
    List<String> forms = new ArrayList<String>();
    for (Species f : Dex.species.values()) {
      if (f == s || f.cosmetic) continue;
      Species fb = Dex.byName.get(Dex.toId(f.baseSpecies));
      if (fb != base && f != base) continue;
      String kind = f.mega ? "mega" : f.gmax ? "gmax" : f.primal ? "primal" : f.battleOnly ? "battle" : "forme";
      forms.add(new O().p("id", f.id).p("sk", sk(f)).p("name", f.name).p("kind", kind).p("stone", f.reqItems.length > 0 ? Items.name(f.reqItems[0]) : "").toString());
    }
    o.add("forms", arr(forms));
    return o.toString();
  }

  // ------------------------------------------------------------ combate
  static String monBattle(Mon m, boolean player) {
    O o = new O();
    o.p("name", m.name()).p("species", m.normalSp.name).p("sid", m.sp.id).p("sk", sk(m.sp)).p("num", m.sp.num).p("level", m.level).p("hp", Math.max(0, m.hp)).p("maxHp", m.maxHp).p("status", m.status)
     .p("alive", m.alive()).p("dyna", m.dynamaxed).p("mega", m.megaed).p("item", m.itemId()).p("ability", abName(m.ability)).add("types", strArr(m.type1, m.type2 == null ? "" : m.type2))
     .add("stage", intArr(m.stage[0], m.stage[1], m.stage[2], m.stage[3], m.stage[4], m.stage[5], m.stage[6], m.stage[7]));
    return o.toString();
  }

  static String sideJson(int i) {
    Side s = battle.sides[i];
    List<String> pm = new ArrayList<String>();
    for (int k = 0; k < s.party.size(); k++) { Mon m = s.party.get(k); pm.add(new O().p("name", m.name()).p("level", m.level).p("hp", Math.max(0, m.hp)).p("maxHp", m.maxHp).p("status", m.status).p("alive", m.alive()).p("sid", m.sp.id).p("sk", sk(m.sp)).p("active", m == s.active).toString()); }
    O o = new O();
    o.p("name", s.name).p("trainer", s.trainer).add("party", arr(pm)).p("transformed", s.transformed)
     .p("rocks", s.stealthRock).p("spikes", s.spikes).p("tspikes", s.toxicSpikes).p("web", s.stickyWeb).p("reflect", s.reflect).p("lscreen", s.lightScreen).p("veil", s.auraVeil).p("tailwind", s.tailwind);
    if (s.active != null) o.add("active", monBattle(s.active, i == 0));
    return o.toString();
  }

  static String battleJson() {
    O o = new O();
    o.p("over", battle.over).p("winner", battle.winner).p("wild", battle.wild).p("turn", battle.turn).p("weather", battle.weather).p("terrain", battle.terrain).p("trickRoom", battle.trickRoom)
     .add("needSwitch", "[" + battle.needSwitch[0] + "," + battle.needSwitch[1] + "]").p("caught", battle.caught).p("escaped", battle.escaped);
    Side me = battle.sides[0]; Mon u = me.active;
    o.p("canMega", battle.canMega(me)).p("canDyna", battle.canDynamax(me)).p("canSwitch", battle.canSwitch(me)).p("noCatch", battle.nuzlockeNoCatch);
    Species mf = u == null ? null : u.megaForm();
    o.p("megaName", mf == null ? "" : mf.name);
    if (u != null) {
      List<String> mv = new ArrayList<String>(), mx = new ArrayList<String>();
      List<Integer> usable = battle.usableMoves(u);
      for (int i = 0; i < u.moves.length; i++) {
        Move base = Dex.mv(u.moves[i]);
        Move eff = battle.effectiveMove(u, i);
        Move max = u.dynamaxed ? eff : battle.maxVersion(u, base);
        mv.add(moveJson(eff, u.pp[i], u.maxPp[i]).replace("}", ",\"usable\":" + usable.contains(i) + "}"));
        mx.add(moveJson(max, u.pp[i], u.maxPp[i]));
      }
      o.add("moves", arr(mv)).add("maxMoves", arr(mx));
    }
    o.add("sides", "[" + sideJson(0) + "," + sideJson(1) + "]");
    return o.toString();
  }

  static String eventsJson() {
    List<String> l = new ArrayList<String>();
    for (BEvent e : battle.takeEvents()) {
      O o = new O();
      o.p("msg", e.msg).p("hitSide", e.hitSide).p("anim", e.anim).p("weather", e.weather).p("terrain", e.terrain)
       .add("name", strArr(nz(e.name[0]), nz(e.name[1]))).add("hp", intArr(e.hp[0], e.hp[1])).add("maxHp", intArr(e.maxHp[0], e.maxHp[1])).add("level", intArr(e.level[0], e.level[1]))
       .add("status", strArr(nz(e.status[0]), nz(e.status[1]))).add("spId", strArr(nz(e.spId[0]), nz(e.spId[1]))).add("sk", strArr(skOf(nz(e.spId[0])), skOf(nz(e.spId[1])))).add("num", intArr(numOf(nz(e.spId[0])), numOf(nz(e.spId[1]))))
       .add("dyna", "[" + e.dyna[0] + "," + e.dyna[1] + "]").add("mega", "[" + e.mega[0] + "," + e.mega[1] + "]");
      l.add(o.toString());
    }
    return arr(l);
  }
  static String nz(String s) { return s == null ? "" : s; }
  static int numOf(String sid) { Species s = Dex.species.get(sid); return s == null ? 0 : s.num; }

  static String finishJson() {
    Game.Result r = game.finish(battle, null);
    game.checkChampion();
    List<String> msgs = new ArrayList<String>();
    for (String s : r.msgs) msgs.add(q(s));
    List<String> learn = new ArrayList<String>(), evo = new ArrayList<String>();
    for (Object[] x : r.learn) { Mon mo = (Mon) x[0]; Move mv = Dex.mv((String) x[1]); learn.add("[" + game.party.indexOf(mo) + "," + q((String) x[1]) + "," + q(mv == null ? "" : mv.dn()) + "]"); }
    for (Object[] x : r.evolve) { Mon mo = (Mon) x[0]; Species s = (Species) x[1]; evo.add("[" + game.party.indexOf(mo) + "," + q(s.id) + "," + q(s.name) + "]"); }
    O o = new O();
    o.add("msgs", arr(msgs)).add("learn", arr(learn)).add("evolve", arr(evo)).p("won", r.won).p("lost", r.lost).p("fled", r.fled).p("captured", r.captured).p("gameOver", r.gameOver).p("champion", game.champion)
     .p("capturedWhere", r.capturedWhere).p("capturedIdx", r.capturedMon == null ? -1 : game.party.indexOf(r.capturedMon)).p("capturedBoxIdx", r.capturedMon == null ? -1 : game.box.indexOf(r.capturedMon))
     .p("capturedName", r.capturedMon == null ? "" : r.capturedMon.normalSp.name);
    return o.toString();
  }

  // ------------------------------------------------------------ importación de sprites de Añil (Essentials)
  static Species baseOf(String id) {
    String k = Dex.toId(id);
    if (k.equals("nidoranfe")) k = "nidoranf"; else if (k.equals("nidoranma")) k = "nidoranm";
    return Dex.byName.get(k);
  }

  /** Clave de sprite para el archivo NOMBRE_n.png de un juego de Essentials ("" si no se reconoce). */
  static String formKey(String name, int n, String formName, String megaStone, String megaMove) {
    Species base = baseOf(name);
    if (base == null) return "";
    if (n == 0) return sk(base);
    String fn = Dex.toId(formName);
    List<Species> megas = Dex.megasOf.get(base.id);
    boolean isMega = megaStone.length() > 0 || megaMove.length() > 0 || formName.toLowerCase().contains("mega");
    if (isMega && megas != null) {
      String stone = Dex.toId(megaStone);
      for (Species s : megas) for (String ri : s.reqItems) if (Dex.toId(ri).equals(stone)) return sk(s);
      String last = formName.trim(); last = last.substring(last.lastIndexOf(' ') + 1).toLowerCase();
      for (Species s : megas) if (s.forme.toLowerCase().endsWith("-" + last)) return sk(s);
      if (megaMove.length() > 0) for (Species s : megas) if (s.reqItems.length == 0) return sk(s);
      if (megas.size() == 1) return sk(megas.get(0));
      return "";
    }
    if (fn.contains("gigantamax") || fn.contains("gmax")) { Species g = Dex.gmaxOf.get(base.id); return g == null ? "" : sk(g); }
    String[][] reg = {{"alola", "Alola"}, {"galar", "Galar"}, {"hisui", "Hisui"}, {"paldea", "Paldea"}};
    for (String[] r : reg) if (fn.contains(r[0])) {
      for (Species s : Dex.species.values()) if (Dex.toId(s.baseSpecies).equals(Dex.toId(base.baseSpecies)) && s.forme.toLowerCase().startsWith(r[1].toLowerCase()) && !s.mega && !s.gmax && !s.cosmetic) return sk(s);
    }
    for (Species s : Dex.species.values()) {
      if (s.cosmetic || s.mega || s.gmax || s.forme.isEmpty() || !Dex.toId(s.baseSpecies).equals(Dex.toId(base.baseSpecies))) continue;
      String sf = Dex.toId(s.forme);
      if (sf.length() >= 3 && fn.contains(sf)) return sk(s);
    }
    return "";
  }
}
