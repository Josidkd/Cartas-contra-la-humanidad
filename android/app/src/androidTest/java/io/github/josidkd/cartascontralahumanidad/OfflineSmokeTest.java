package io.github.josidkd.cartascontralahumanidad;

import static androidx.test.espresso.web.assertion.WebViewAssertions.webMatches;
import static androidx.test.espresso.web.sugar.Web.onWebView;
import static androidx.test.espresso.web.webdriver.DriverAtoms.findElement;
import static androidx.test.espresso.web.webdriver.DriverAtoms.getText;
import static androidx.test.espresso.web.webdriver.DriverAtoms.getAttribute;
import static androidx.test.espresso.web.webdriver.DriverAtoms.webClick;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.Assert.assertTrue;

import android.os.SystemClock;
import android.webkit.WebView;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.espresso.web.webdriver.Locator;
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
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            assertTrue("Bundled game did not load within 20 seconds", waitForHome(scenario));
            onWebView()
                .withElement(findElement(Locator.ID, "titulo-inicio"))
                .check(webMatches(getText(), containsString("humanidad")));
            onWebView()
                .withElement(findElement(Locator.CSS_SELECTOR, "#inicio-app button[type='submit']"))
                .perform(webClick());
            onWebView()
                .withElement(findElement(Locator.ID, "titulo-jugadores"))
                .check(webMatches(getText(), containsString("Que nadie se quede fuera")));
            onWebView().withElement(findElement(Locator.ID, "nombre-1"))
                .check(webMatches(getAttribute("id"), equalTo("nombre-1")));
            onWebView().withElement(findElement(Locator.ID, "nombre-3"))
                .check(webMatches(getAttribute("id"), equalTo("nombre-3")));
        }
    }

    private boolean waitForHome(ActivityScenario<MainActivity> scenario) throws Exception {
        long deadline = SystemClock.elapsedRealtime() + 20000;
        while (SystemClock.elapsedRealtime() < deadline) {
            CountDownLatch evaluated = new CountDownLatch(1);
            AtomicBoolean ready = new AtomicBoolean(false);
            scenario.onActivity(activity -> {
                WebView webView = activity.getBridge().getWebView();
                webView.evaluateJavascript(
                    "Boolean(document.getElementById('numJugadores'))",
                    value -> {
                        ready.set("true".equals(value));
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
