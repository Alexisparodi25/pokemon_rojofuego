package pokefuego.engine;
import java.util.*;

/** Reglas de la partida (todas configurables al empezar). */
public class Rules {
  // ---- dificultad: 0 Normal, 1 Difícil, 2 Extremo ----
  public int difficulty = 1;
  // ---- reglas generales ----
  public boolean levelCap = true;          // tope de nivel por jefe
  public boolean battleItems = true;       // usar objetos de la mochila en combates de entrenador
  public boolean askNickname = true;       // preguntar apodo al capturar
  // ---- Nuzlocke ----
  public boolean nuzlocke;
  public boolean firstEncounterOnly = true;  // sólo se captura el primer Pokémon de cada zona
  public boolean dupesClause = true;         // el primer encuentro nunca es de una especie que ya tienes
  public boolean permadeath = true;          // los debilitados mueren para siempre
  // ---- aleatorio ----
  public boolean randomStarters, randomWild, randomTrainers;
  public boolean similarBst = true;          // mantener una fuerza parecida a la original
  public int abilities = 0;                  // 0 originales, 1 aleatorias (todas), 2 aleatorias (sólo con efecto en el juego)
  public int moves = 0;                      // 0 por nivel, 1 aleatorios legales/inteligentes, 2 totalmente aleatorios
  public int legendaries = 1;                // 0 nunca, 1 según el nivel, 2 siempre posibles

  public void setRandom(boolean b) { randomStarters = randomWild = randomTrainers = b; }
  public boolean isRandom() { return randomStarters || randomWild || randomTrainers || abilities > 0 || moves > 0; }
  public boolean hardAI() { return difficulty >= 1; }
  public boolean nuzDeath() { return nuzlocke && permadeath; }
  public boolean nuzFirst() { return nuzlocke && firstEncounterOnly; }
  public String difficultyName() { return difficulty == 0 ? "NORMAL" : difficulty == 1 ? "DIFÍCIL" : "EXTREMO"; }

  public String serialize() {
    return "difficulty=" + difficulty + ",levelCap=" + b(levelCap) + ",battleItems=" + b(battleItems) + ",askNickname=" + b(askNickname)
      + ",nuzlocke=" + b(nuzlocke) + ",firstEncounterOnly=" + b(firstEncounterOnly) + ",dupesClause=" + b(dupesClause) + ",permadeath=" + b(permadeath)
      + ",randomStarters=" + b(randomStarters) + ",randomWild=" + b(randomWild) + ",randomTrainers=" + b(randomTrainers) + ",similarBst=" + b(similarBst)
      + ",abilities=" + abilities + ",moves=" + moves + ",legendaries=" + legendaries;
  }
  static int b(boolean x) { return x ? 1 : 0; }

  public static Rules parse(String s) {
    Rules r = new Rules();
    for (String kv : s.split(",")) {
      String[] p = kv.split("=");
      if (p.length < 2) continue;
      int v = Integer.parseInt(p[1].trim());
      switch (p[0].trim()) {
        case "difficulty": r.difficulty = v; break; case "levelCap": r.levelCap = v == 1; break;
        case "battleItems": r.battleItems = v == 1; break; case "askNickname": r.askNickname = v == 1; break;
        case "nuzlocke": r.nuzlocke = v == 1; break; case "firstEncounterOnly": r.firstEncounterOnly = v == 1; break;
        case "dupesClause": r.dupesClause = v == 1; break; case "permadeath": r.permadeath = v == 1; break;
        case "randomStarters": r.randomStarters = v == 1; break; case "randomWild": r.randomWild = v == 1; break;
        case "randomTrainers": r.randomTrainers = v == 1; break; case "similarBst": r.similarBst = v == 1; break;
        case "abilities": r.abilities = v; break; case "moves": r.moves = v; break; case "legendaries": r.legendaries = v; break;
      }
    }
    return r;
  }
}
