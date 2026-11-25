// Prueba: sprites reales (descarga), taza del Centro Pokémon y Caramelo Nivelador.
import pokefuego.engine.*;
import processing.core.*;
import processing.event.KeyEvent;
import java.io.File;
import java.util.*;

public class UiTest4 {
  static Sketch s; static String outDir;
  static void press(char c, int code) throws Exception { s.postEvent(new KeyEvent(null, System.currentTimeMillis(), KeyEvent.PRESS, 0, c, code)); Thread.sleep(110); }
  static void ok() throws Exception { press('z', 90); }
  static void shot(String n) throws Exception { Thread.sleep(300); s.noLoop(); Thread.sleep(250); s.save(outDir + "/" + n + ".png"); s.loop(); System.out.println("shot " + n); }
  static Mon mk(Game g, String sp, int lv, String item) { Mon m = Mon.create(Dex.sp(sp), lv, g.rng); m.setMoves(MoveGen.smartSet(m.normalSp, lv, g.rng)); m.item = item; m.checkItemForme(); return m; }
  public static void main(String[] a) throws Exception {
    outDir = a[0]; new File(outDir).mkdirs();
    s = new Sketch();
    PApplet.runSketch(new String[]{"--sketch-path=" + a[1], "Sketch"}, s);
    Thread.sleep(3500);
    Game g = new Game(new Rules(), 9); g.chooseStarter("charmander"); g.party.clear();
    g.party.add(mk(g, "charizard", 40, "charizarditey")); g.party.add(mk(g, "pikachu", 30, "")); g.party.add(mk(g, "garchomp", 38, ""));
    g.party.add(mk(g, "rowlet", 20, "")); g.party.add(mk(g, "mewtwo", 44, "")); g.party.add(mk(g, "pidgey", 8, ""));
    g.badges = 2; g.placeIdx = 6; g.money = 5000;
    System.out.println("promedio=" + g.avgLevel() + " tope=" + g.levelCap() + " objetivo=" + g.candyTarget() + " taza=" + g.cupAvailable());
    System.out.println("tomar taza: " + g.takeFromCup() + " caramelos=" + g.bag.count("levelcandy") + " otra vez=" + g.takeFromCup());
    Mon low = g.party.get(5); int before = low.level;
    Game.Result r = g.useLevelCandy(low);
    System.out.println("pidgey " + before + " -> " + low.level + " msgs=" + r.msgs + " movs nuevos=" + r.learn.size() + " evol=" + r.evolve.size());
    System.out.println("sobre mewtwo (44>promedio): " + g.useLevelCandy(g.party.get(4)));
    g.badges = 3; System.out.println("tras nueva medalla, taza=" + g.cupAvailable());
    List<String> sv = g.serialize(); Game g2 = Game.deserialize(sv); System.out.println("guardado cupAt=" + g2.places.get(6).cupAt);
    s.game = g; s.stack.clear(); s.pushScene(s.new MapScene());
    Thread.sleep(500);
    s.pushScene(s.new PartyScene(0, null, null));
    Thread.sleep(9000);               // dar tiempo a descargar sprites
    shot("50_party_sprites");
    s.stack.clear(); s.pushScene(s.new MapScene());
    g.placeIdx = 4; g.badges = 0;
    s.pushScene(s.new BattleScene(g.trainerBattle(g.nextBoss())));
    Thread.sleep(9000);
    for (int i = 0; i < 12; i++) { ok(); Thread.sleep(80); }
    shot("51_battle_sprites");
    System.out.println("sprites en caché: " + new File(a[1] + "/data/sprites").list().length);
    System.out.println("done"); System.exit(0);
  }
}
