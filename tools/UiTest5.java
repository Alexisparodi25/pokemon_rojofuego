// Prueba: nueva partida (opciones, personaje, escribir texto, apodo), Ayuda y Pokédex completa.
import pokefuego.engine.*;
import processing.core.*;
import processing.event.KeyEvent;
import java.io.File;

public class UiTest5 {
  static Sketch s; static String outDir;
  static void press(char c, int code) throws Exception { s.postEvent(new KeyEvent(null, System.currentTimeMillis(), KeyEvent.PRESS, 0, c, code)); Thread.sleep(130); }
  static void ok() throws Exception { press('z', 90); }
  static void back() throws Exception { press('x', 88); }
  static void down() throws Exception { press((char) PConstants.CODED, PConstants.DOWN); }
  static void right() throws Exception { press((char) PConstants.CODED, PConstants.RIGHT); }
  static void left() throws Exception { press((char) PConstants.CODED, PConstants.LEFT); }
  static void enter() throws Exception { press('\n', 10); }
  static void bksp() throws Exception { press((char) 8, 8); }
  static void type(String t) throws Exception { for (char c : t.toCharArray()) press(c, 0); }
  static void shot(String n) throws Exception { Thread.sleep(300); s.noLoop(); Thread.sleep(250); s.save(outDir + "/" + n + ".png"); s.loop(); System.out.println("shot " + n); }
  public static void main(String[] a) throws Exception {
    outDir = a[0]; new File(outDir).mkdirs();
    s = new Sketch();
    PApplet.runSketch(new String[]{"--sketch-path=" + a[1], "Sketch"}, s);
    Thread.sleep(3500);
    ok(); shot("60_newgame");
    right(); shot("60b_extremo"); left();
    for (int i = 0; i < 4; i++) down(); ok(); shot("61_random_opts");
    for (int i = 0; i < 4; i++) down(); right(); down(); right(); shot("61b_random_abilities"); back();
    down(); down(); ok(); shot("62_character");
    ok(); for (int i = 0; i < 4; i++) bksp(); type("Ash"); shot("63_typing"); enter();
    down(); down(); right(); right(); down(); right(); shot("64_character_look"); back();
    shot("65_root_after");
    down(); ok();                       // comenzar
    Thread.sleep(400); shot("66_starter");
    ok(); Thread.sleep(300); ok();      // elegir + "Sí"
    Thread.sleep(400); ok();            // "¿apodo?" sí
    Thread.sleep(300); type("Fuego"); shot("67_nickname"); enter();
    Thread.sleep(300); for (int i = 0; i < 4; i++) { ok(); Thread.sleep(150); }
    shot("68_map");
    Game g = s.game;
    System.out.println("jugador=" + g.playerName + " rival=" + g.rivalName + " inicial=" + g.party.get(0).name() + " (" + g.party.get(0).normalSp.name + ") dif=" + g.rules.difficulty + " hab=" + g.rules.abilities);
    s.pushScene(s.new HelpScene()); shot("70_help");
    s.stack.clear(); s.pushScene(s.new MapScene());
    g.caught.add("charizard"); g.dex.add("charizard");
    s.pushScene(s.new DexDetailScene(Dex.sp("charizard"))); shot("71_dex_info");
    right(); shot("72_dex_levelmoves"); right(); shot("73_dex_othermoves"); right(); shot("74_dex_evolution");
    System.out.println("done"); System.exit(0);
  }
}
