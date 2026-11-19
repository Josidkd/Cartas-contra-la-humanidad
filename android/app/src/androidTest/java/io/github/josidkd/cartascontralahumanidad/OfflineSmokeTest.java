package io.github.josidkd.cartascontralahumanidad;

import static androidx.test.espresso.web.assertion.WebViewAssertions.webMatches;
import static androidx.test.espresso.web.sugar.Web.onWebView;
import static androidx.test.espresso.web.webdriver.DriverAtoms.findElement;
import static androidx.test.espresso.web.webdriver.DriverAtoms.getText;
import static androidx.test.espresso.web.webdriver.DriverAtoms.webClick;
import static androidx.test.espresso.web.webdriver.DriverAtoms.webKeys;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.isEmptyString;
import static org.junit.Assert.assertTrue;

import android.os.SystemClock;
import android.os.Build;
import android.app.KeyguardManager;
import android.os.ParcelFileDescriptor;
import android.os.PowerManager;
import android.util.Log;
import android.view.WindowManager;
import android.webkit.WebView;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.espresso.web.webdriver.Locator;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.InputStream;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Runs on an emulator with Wi-Fi and mobile data disabled by the workflow. */
@RunWith(AndroidJUnit4.class)
public class OfflineSmokeTest {
    @Test
    public void packagedGameStartsAndOpensConfigurationWithoutNetwork() throws Exception {
        runShell("input keyevent KEYCODE_WAKEUP");
        runShell("wm dismiss-keyguard");
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            scenario.onActivity(activity -> {
                activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                if (Build.VERSION.SDK_INT >= 27) {
                    activity.setShowWhenLocked(true);
                    activity.setTurnScreenOn(true);
                } else {
                    activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                        | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                        | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD);
                }
                if (Build.VERSION.SDK_INT >= 26) {
                    KeyguardManager keyguard = activity.getSystemService(KeyguardManager.class);
                    keyguard.requestDismissKeyguard(activity, null);
                }
            });
            boolean ready = waitForHome(scenario);
            if (!ready) {
                scenario.onActivity(activity -> {
                    WebView webView = activity.getBridge().getWebView();
                    Log.e("OfflineSmoke", "activityFocus=" + activity.hasWindowFocus()
                        + " webFocus=" + webView.hasWindowFocus()
                        + " shown=" + webView.isShown()
                        + " attached=" + webView.isAttachedToWindow()
                        + " keyguard=" + activity.getSystemService(KeyguardManager.class).isKeyguardLocked()
                        + " interactive=" + activity.getSystemService(PowerManager.class).isInteractive()
                        + " url=" + webView.getUrl());
                });
            }
            assertTrue("Bundled game did not become visible and focused within 20 seconds", ready);
            onWebView()
                .withElement(findElement(Locator.ID, "titulo-inicio"))
                .check(webMatches(getText(), containsString("humanidad")));
            onWebView()
                .withElement(findElement(Locator.CSS_SELECTOR, "#inicio-app button[type='submit']"))
                .perform(webClick());
            onWebView()
                .withElement(findElement(Locator.ID, "titulo-jugadores"))
                .check(webMatches(getText(), containsString("Que nadie se quede fuera")));
            onWebView().withElement(findElement(Locator.CSS_SELECTOR, "label[for='nombre-1']"))
                .check(webMatches(getText(), containsString("Jugador 01")));
            onWebView().withElement(findElement(Locator.CSS_SELECTOR, "label[for='nombre-3']"))
                .check(webMatches(getText(), containsString("Jugador 03")));
            for (int i = 1; i <= 3; i++) {
                onWebView().withElement(findElement(Locator.ID, "nombre-" + i))
                    .perform(webKeys("Persona Android " + i));
            }
            onWebView().withElement(findElement(Locator.CSS_SELECTOR, "#crear-jugadores button[type='submit']"))
                .perform(webClick());
            onWebView().withElement(findElement(Locator.ID, "titulo-turno"))
                .check(webMatches(getText(), containsString("Persona Android 1")));
            onWebView().withElement(findElement(Locator.CSS_SELECTOR, "#divContenido .button-primary"))
                .perform(webClick());
            onWebView().withElement(findElement(Locator.CSS_SELECTOR, ".question .card-copy"))
                .check(webMatches(getText(), not(isEmptyString())));
        }
    }

    private void runShell(String command) throws Exception {
        try (InputStream output = new ParcelFileDescriptor.AutoCloseInputStream(
                InstrumentationRegistry.getInstrumentation().getUiAutomation().executeShellCommand(command))) {
            byte[] buffer = new byte[256];
            while (output.read(buffer) != -1) { /* Wait for completion without logging shell output. */ }
        }
    }

    private boolean waitForHome(ActivityScenario<MainActivity> scenario) throws Exception {
        long deadline = SystemClock.elapsedRealtime() + 20000;
        while (SystemClock.elapsedRealtime() < deadline) {
            CountDownLatch evaluated = new CountDownLatch(1);
            AtomicBoolean ready = new AtomicBoolean(false);
            scenario.onActivity(activity -> {
                WebView webView = activity.getBridge().getWebView();
                boolean focused = webView.hasWindowFocus();
                webView.evaluateJavascript(
                    "Boolean(document.getElementById('numJugadores'))",
                    value -> {
                        ready.set(focused && "true".equals(value));
                        evaluated.countDown();
                    }
                );
            });
            if (evaluated.await(2, TimeUnit.SECONDS) && ready.get()) return true;
            SystemClock.sleep(50); // Bounded polling for the real DOM, not a fixed startup delay.
        }
        return false;
    }
}
