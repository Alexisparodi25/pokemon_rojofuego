package pokefuego.web;

import org.teavm.jso.JSBody;
import org.teavm.jso.JSFunctor;
import org.teavm.jso.JSObject;

/** Punto de entrada para el navegador: publica window.JavaCall(método, argumentos) -> JSON. */
public class Main {
  @JSFunctor
  public interface CallFn extends JSObject { String call(String method, String args); }

  @JSBody(params = {"f"}, script = "window.JavaCall = function(m, a) { return f(m, a); };")
  static native void install(CallFn f);

  public static void main(String[] args) {
    install(new CallFn() { public String call(String m, String a) { return Api.call(m, a); } });
  }
}
