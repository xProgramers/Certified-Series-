package com.certifiedseries.app;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

/**
 * Loads https://certified-series.vercel.app (capacitor.config.json server.url).
 * Edge to edge on every Android version, as Android 15+ already forces it; the
 * site pads itself with the safe areas Capacitor's SystemBars injects.
 */
public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
    }
}
