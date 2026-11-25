package pokefuego.engine;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.*;
import javax.imageio.ImageIO;

/**
 * Importa sprites de Pokémon (frente y espalda) desde la carpeta de un juego hecho con Pokémon Essentials
 * (por ejemplo Pokémon Añil): Graphics/Pokemon/Front y /Back, y PBS/pokemon_forms.txt para saber qué es cada forma.
 * Los PNG se guardan como f_&lt;especie&gt;.png / b_&lt;especie&gt;.png. No pisa los sprites de Gen 1-3 ya importados del ROM.
 */
public class AnilImporter {
  static final Map<String, String> ALIAS = new HashMap<String, String>();
  static {
    ALIAS.put("nidoranfe", "nidoranf"); ALIAS.put("nidoranma", "nidoranm"); ALIAS.put("hooh", "hooh");
    ALIAS.put("mrmime", "mrmime"); ALIAS.put("mimejr", "mimejr");
  }

  static class FormInfo { String name = "", megaStone = "", megaMove = ""; }

  static File find(File root, String... names) {
    File cur = root;
    for (String n : names) {
      File[] ch = cur.listFiles();
      File hit = null;
      if (ch != null) for (File c : ch) if (c.isDirectory() && c.getName().equalsIgnoreCase(n)) hit = c;
      if (hit == null) return null;
      cur = hit;
    }
    return cur;
  }

  /** Localiza Graphics/Pokemon aunque el usuario elija la carpeta del juego, Graphics, Pokemon o Front. */
  static File[] locate(File sel) {
    File[] cands = {sel, sel.getParentFile(), sel.getParentFile() == null ? null : sel.getParentFile().getParentFile(), sel.getParentFile() == null || sel.getParentFile().getParentFile() == null ? null : sel.getParentFile().getParentFile().getParentFile()};
    for (File c : cands) {
      if (c == null) continue;
      File pk = find(c, "Graphics", "Pokemon"); if (pk == null) pk = find(c, "Pokemon"); if (pk == null && c.getName().equalsIgnoreCase("Pokemon")) pk = c;
      if (pk != null && find(pk, "Front") != null) {
        File game = null;
        for (File up = sel; up != null && game == null; up = up.getParentFile()) if (find(up, "PBS") != null) game = up;
        if (game == null) game = c;
        return new File[]{find(pk, "Front"), find(pk, "Back"), game};
      }
    }
    return null;
  }

  static Map<String, FormInfo> readForms(File game) throws IOException {
    Map<String, FormInfo> map = new HashMap<String, FormInfo>();
    File pbs = find(game, "PBS");
    if (pbs == null) return map;
    File f = null;
    File[] ch = pbs.listFiles();
    if (ch != null) for (File c : ch) { String n = c.getName().toLowerCase(); if (n.equals("pokemon_forms.txt") || n.equals("pokemonforms.txt")) f = c; }
    if (f == null) return map;
    BufferedReader r = new BufferedReader(new InputStreamReader(new FileInputStream(f), StandardCharsets.UTF_8));
    String line, key = null; FormInfo cur = null;
    Pattern sec = Pattern.compile("^\\[([A-Za-z0-9_]+)\\s*,\\s*(\\d+)\\]");
    while ((line = r.readLine()) != null) {
      line = line.trim();
      Matcher m = sec.matcher(line);
      if (m.find()) { key = m.group(1).toUpperCase() + "#" + m.group(2); cur = new FormInfo(); map.put(key, cur); continue; }
      if (cur == null || line.startsWith("#")) continue;
      int eq = line.indexOf('=');
      if (eq < 0) continue;
      String k = line.substring(0, eq).trim(), v = line.substring(eq + 1).trim();
      if (k.equals("FormName")) cur.name = v; else if (k.equals("MegaStone")) cur.megaStone = v; else if (k.equals("MegaMove")) cur.megaMove = v;
    }
    r.close();
    return map;
  }

  static Species baseOf(String id) {
    String k = Dex.toId(id); if (ALIAS.containsKey(k)) k = ALIAS.get(k);
    return Dex.byName.get(k);
  }

  /** Especie de nuestros datos que corresponde a [BASE, n]. */
  static Species resolve(Species base, int n, FormInfo fi) {
    if (n == 0) return base;
    if (fi == null) return null;
    String fn = Dex.toId(fi.name);
    List<Species> megas = Dex.megasOf.get(base.id);
    boolean isMega = !fi.megaStone.isEmpty() || !fi.megaMove.isEmpty() || fi.name.toLowerCase().contains("mega");
    if (isMega && megas != null) {
      String stone = Dex.toId(fi.megaStone);
      for (Species s : megas) for (String ri : s.reqItems) if (Dex.toId(ri).equals(stone)) return s;
      String last = fi.name.trim(); last = last.substring(last.lastIndexOf(' ') + 1).toLowerCase();
      for (Species s : megas) if (s.forme.toLowerCase().endsWith("-" + last)) return s;
      if (!fi.megaMove.isEmpty()) for (Species s : megas) if (s.reqItems.length == 0) return s;
      if (megas.size() == 1) return megas.get(0);
      return null;
    }
    if (fn.contains("gigantamax") || fn.contains("gmax")) return Dex.gmaxOf.get(base.id);
    String[][] reg = {{"alola", "Alola"}, {"galar", "Galar"}, {"hisui", "Hisui"}, {"paldea", "Paldea"}};
    for (String[] r : reg) if (fn.contains(r[0])) {
      for (Species s : Dex.species.values()) if (Dex.toId(s.baseSpecies).equals(Dex.toId(base.baseSpecies)) && s.forme.toLowerCase().startsWith(r[1].toLowerCase()) && !s.mega && !s.gmax && !s.cosmetic) return s;
    }
    for (Species s : Dex.species.values()) {
      if (s.cosmetic || s.mega || s.gmax || s.forme.isEmpty() || !Dex.toId(s.baseSpecies).equals(Dex.toId(base.baseSpecies))) continue;
      String sf = Dex.toId(s.forme);
      if (sf.length() >= 3 && fn.contains(sf)) return s;
    }
    return null;
  }

  static String fileKey(Species s) {
    String b = Dex.toId(s.baseSpecies), f = Dex.toId(s.forme);
    return f.isEmpty() ? b : b + "-" + f;
  }

  /** Primer cuadro de la imagen (las animadas son tiras horizontales de cuadros cuadrados). */
  static BufferedImage firstFrame(BufferedImage im) {
    int w = im.getWidth(), h = im.getHeight();
    if (w >= 2 * h && w % h == 0) return im.getSubimage(0, 0, h, h);
    return im;
  }

  /** Devuelve cuántos sprites se importaron. */
  public static int extract(File selected, File outDir) throws IOException {
    File[] loc = locate(selected);
    if (loc == null) throw new IOException("No encontré Graphics/Pokemon/Front dentro de esa carpeta. Elige la carpeta del juego (la que contiene Graphics y PBS).");
    Map<String, FormInfo> forms = readForms(loc[2]);
    outDir.mkdirs();
    int count = 0;
    Pattern pat = Pattern.compile("^([A-Za-z0-9]+?)(?:_(\\d+))?(_female)?\\.png$", Pattern.CASE_INSENSITIVE);
    for (int side = 0; side < 2; side++) {
      File dir = side == 0 ? loc[0] : loc[1];
      if (dir == null) continue;
      File[] files = dir.listFiles();
      if (files == null) continue;
      Arrays.sort(files);
      Set<String> done = new HashSet<String>();
      for (File f : files) {
        Matcher m = pat.matcher(f.getName());
        if (!m.matches() || m.group(3) != null) continue;
        Species base = baseOf(m.group(1));
        if (base == null) continue;
        int n = m.group(2) == null ? 0 : Integer.parseInt(m.group(2));
        Species target = resolve(base, n, forms.get(m.group(1).toUpperCase() + "#" + n));
        if (target == null) continue;
        String key = fileKey(target);
        File out = new File(outDir, (side == 0 ? "f_" : "b_") + key + ".png");
        if (done.contains(key)) continue;
        if (target.num <= 386 && target.forme.isEmpty() && out.exists()) continue;     // no pisar los del ROM
        BufferedImage im;
        try { im = ImageIO.read(f); } catch (IOException e) { continue; }
        if (im == null) continue;
        ImageIO.write(firstFrame(im), "png", out);
        done.add(key); count++;
      }
    }
    return count;
  }
}
