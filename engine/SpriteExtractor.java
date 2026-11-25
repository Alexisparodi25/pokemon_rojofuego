package pokefuego.engine;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.*;
import javax.imageio.ImageIO;

/**
 * Extrae los sprites (frente y espalda) de los Pokémon 1-386 de un ROM de Pokémon Rojo Fuego / Verde Hoja (GBA).
 * Busca las tablas dentro del ROM (no usa direcciones fijas), así que sirve para cualquier idioma/versión.
 * Los PNG se guardan como f_&lt;especie&gt;.png y b_&lt;especie&gt;.png.
 */
public class SpriteExtractor {
  static final String HOENN = "Treecko Grovyle Sceptile Torchic Combusken Blaziken Mudkip Marshtomp Swampert Poochyena Mightyena Zigzagoon Linoone Wurmple Silcoon "
    + "Beautifly Cascoon Dustox Lotad Lombre Ludicolo Seedot Nuzleaf Shiftry Nincada Ninjask Shedinja Taillow Swellow Shroomish Breloom Spinda "
    + "Wingull Pelipper Surskit Masquerain Wailmer Wailord Skitty Delcatty Kecleon Baltoy Claydol Nosepass Torkoal Sableye Barboach Whiscash "
    + "Luvdisc Corphish Crawdaunt Feebas Milotic Carvanha Sharpedo Trapinch Vibrava Flygon Makuhita Hariyama Electrike Manectric Numel Camerupt "
    + "Spheal Sealeo Walrein Cacnea Cacturne Snorunt Glalie Lunatone Solrock Azurill Spoink Grumpig Plusle Minun Mawile Meditite Medicham "
    + "Swablu Altaria Wynaut Duskull Dusclops Roselia Slakoth Vigoroth Slaking Gulpin Swalot Tropius Whismur Loudred Exploud Clamperl Huntail "
    + "Gorebyss Absol Shuppet Banette Seviper Zangoose Relicanth Aron Lairon Aggron Castform Volbeat Illumise Lileep Cradily Anorith Armaldo "
    + "Ralts Kirlia Gardevoir Bagon Shelgon Salamence Beldum Metang Metagross Regirock Regice Registeel Kyogre Groudon Rayquaza Latias Latios "
    + "Jirachi Deoxys Chimecho";

  static int u16(byte[] r, int o) { return (r[o] & 255) | (r[o + 1] & 255) << 8; }
  static long u32(byte[] r, int o) { return (r[o] & 255L) | (r[o + 1] & 255L) << 8 | (r[o + 2] & 255L) << 16 | (r[o + 3] & 255L) << 24; }

  /** Descompresión LZ77 de la BIOS de GBA (tipo 0x10). */
  static byte[] lz77(byte[] rom, int off) {
    if (off < 0 || off + 4 >= rom.length || rom[off] != 0x10) return null;
    int size = (rom[off + 1] & 255) | (rom[off + 2] & 255) << 8 | (rom[off + 3] & 255) << 16;
    if (size <= 0 || size > 1 << 20) return null;
    byte[] out = new byte[size]; int n = 0, p = off + 4;
    while (n < size) {
      int flags = rom[p++] & 255;
      for (int bit = 0; bit < 8 && n < size; bit++) {
        if ((flags & (0x80 >> bit)) != 0) {
          int b1 = rom[p] & 255, b2 = rom[p + 1] & 255; p += 2;
          int len = (b1 >> 4) + 3, disp = ((b1 & 15) << 8 | b2) + 1;
          for (int k = 0; k < len && n < size; k++) { out[n] = out[n - disp]; n++; }
        } else out[n++] = rom[p++];
      }
    }
    return out;
  }

  /** Tablas de 8 bytes con etiquetas 0,1,2... consecutivas: imágenes {ptr, 0x800, etiqueta} o paletas {ptr, etiqueta, 0}. */
  static List<Integer> findTables(byte[] rom, boolean images) {
    List<Integer> found = new ArrayList<Integer>();
    int n = rom.length;
    for (int i = 0; i + 8 * 400 < n; i += 4) {
      long ptr = u32(rom, i); int a = u16(rom, i + 4), b = u16(rom, i + 6);
      if (ptr < 0x08000000L || ptr >= 0x08000000L + n) continue;
      if (images ? !(a == 0x800 && b == 0) : !(a == 0 && b == 0)) continue;
      boolean ok = true;
      for (int k = 1; k < 40 && ok; k++) {
        long p2 = u32(rom, i + 8 * k); int x = u16(rom, i + 8 * k + 4), y = u16(rom, i + 8 * k + 6);
        if (p2 < 0x08000000L || p2 >= 0x08000000L + n) ok = false;
        else if (images ? !(x == 0x800 && y == k) : !(x == k && y == 0)) ok = false;
      }
      if (ok) { found.add(i); i += 8 * 400 - 4; }
    }
    return found;
  }

  static BufferedImage decode(byte[] tiles, byte[] pal) {
    int[] col = new int[16];
    for (int i = 0; i < 16; i++) {
      int c = (pal[2 * i] & 255) | (pal[2 * i + 1] & 255) << 8;
      int r = (c & 31) * 255 / 31, g = (c >> 5 & 31) * 255 / 31, b = (c >> 10 & 31) * 255 / 31;
      col[i] = i == 0 ? 0 : (255 << 24 | r << 16 | g << 8 | b);
    }
    BufferedImage im = new BufferedImage(64, 64, BufferedImage.TYPE_INT_ARGB);
    for (int t = 0; t < 64; t++) {
      int tx = (t % 8) * 8, ty = (t / 8) * 8;
      for (int y = 0; y < 8; y++) for (int x = 0; x < 4; x++) {
        int by = tiles[t * 32 + y * 4 + x] & 255;
        im.setRGB(tx + x * 2, ty + y, col[by & 15]);
        im.setRGB(tx + x * 2 + 1, ty + y, col[by >> 4]);
      }
    }
    return im;
  }

  /** Devuelve cuántos Pokémon se extrajeron. Lanza IOException con un mensaje legible si el ROM no sirve. */
  public static int extract(byte[] rom, File outDir) throws IOException {
    if (rom.length < 0x400000) throw new IOException("El archivo no parece un ROM de GBA.");
    String code = new String(rom, 0xAC, 4);
    List<Integer> img = findTables(rom, true), pals = new ArrayList<Integer>();
    for (int p : findTables(rom, false)) { byte[] d = lz77(rom, (int) (u32(rom, p) - 0x08000000L)); if (d != null && d.length == 32) pals.add(p); }
    if (img.size() < 2 || pals.isEmpty()) throw new IOException("No encontré las tablas de sprites (ROM " + code + "). Hace falta un ROM de Pokémon Rojo Fuego o Verde Hoja sin modificar.");
    int front = img.get(0), back = img.get(1), pal = pals.get(0);
    Map<Integer, Species> internal = new HashMap<Integer, Species>();
    for (int i = 1; i <= 251; i++) { Species s = baseByNum(i); if (s != null) internal.put(i, s); }
    String[] h = HOENN.split(" ");
    for (int k = 0; k < h.length; k++) { Species s = Dex.byName.get(Dex.toId(h[k])); if (s != null) internal.put(277 + k, s); }
    outDir.mkdirs();
    int done = 0;
    for (Map.Entry<Integer, Species> e : internal.entrySet()) {
      int idx = e.getKey(); String sid = Dex.toId(e.getValue().baseSpecies);
      byte[] pd = lz77(rom, (int) (u32(rom, pal + 8 * idx) - 0x08000000L));
      if (pd == null || pd.length < 32) continue;
      boolean any = false;
      for (int t = 0; t < 2; t++) {
        byte[] tiles = lz77(rom, (int) (u32(rom, (t == 0 ? front : back) + 8 * idx) - 0x08000000L));
        if (tiles == null || tiles.length < 2048) continue;
        byte[] t2 = Arrays.copyOf(tiles, 2048), p2 = Arrays.copyOf(pd, 32);     // Castform/Deoxys: se usa la primera imagen
        ImageIO.write(decode(t2, p2), "png", new File(outDir, (t == 0 ? "f_" : "b_") + sid + ".png"));
        any = true;
      }
      if (any) done++;
    }
    return done;
  }

  static Species baseByNum(int num) {
    for (Species s : Dex.species.values()) if (s.num == num && s.forme.isEmpty() && !s.mega && !s.gmax && !s.cosmetic && !s.primal) return s;
    return null;
  }
}
