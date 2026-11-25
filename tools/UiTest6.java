// Prueba: importar sprites desde un ROM dentro del juego y verlos en el equipo y en combate.
import pokefuego.engine.*;
import processing.core.*;
import processing.event.KeyEvent;
import java.io.File;
import java.util.*;

public class UiTest6 {
  static Sketch s; static String outDir;
  static void ok() throws Exception { s.postEvent(new KeyEvent(null, System.currentTimeMillis(), KeyEvent.PRESS, 0, 'z', 90)); Thread.sleep(100); }
  static void shot(String n) throws Exception { Thread.sleep(300); s.noLoop(); Thread.sleep(250); s.save(outDir + "/" + n + ".png"); s.loop(); System.out.println("shot " + n); }
  static Mon mk(Game g, String sp, int lv) { Mon m = Mon.create(Dex.sp(sp), lv, g.rng); m.setMoves(MoveGen.smartSet(m.normalSp, lv, g.rng)); return m; }
  public static void main(String[] a) throws Exception {
    outDir = a[0]; new File(outDir).mkdirs();
    s = new Sketch();
    PApplet.runSketch(new String[]{"--sketch-path=" + a[1], "Sketch"}, s);
    Thread.sleep(3500);
    s.romSelected(new File(a[2]));
    Thread.sleep(6000);
    System.out.println("sprites importados: " + new File(a[1] + "/data/sprites").list().length);
    Game g = new Game(new Rules(), 4); g.chooseStarter("charmander"); g.party.clear();
    for (String sp : new String[]{"charizard", "blastoise", "alakazam", "gengar", "dragonite", "snorlax"}) g.party.add(mk(g, sp, 45));
    g.badges = 1; g.placeIdx = 6; s.game = g; s.stack.clear(); s.pushScene(s.new MapScene());
    s.pushScene(s.new PartyScene(0, null, null)); shot("80_party_rom");
    s.stack.clear(); s.pushScene(s.new MapScene());
    s.pushScene(s.new BattleScene(g.trainerBattle(g.nextBoss())));
    for (int i = 0; i < 12; i++) { ok(); Thread.sleep(80); }
    shot("81_battle_rom");
    // marcador (sin sprite): Pokémon de Gen 4+ sin conexión
    s.spriteMissing.add("f_garchomp"); s.spriteMissing.add("b_garchomp"); s.spriteMissing.add("f_lucario"); s.spriteMissing.add("b_lucario");
    g.party.clear(); g.party.add(mk(g, "garchomp", 40)); g.party.add(mk(g, "lucario", 40)); g.party.add(mk(g, "pikachu", 40));
    s.stack.clear(); s.pushScene(s.new MapScene()); s.pushScene(s.new PartyScene(0, null, null)); shot("82_placeholder");
    System.out.println("done"); System.exit(0);
  }
}
