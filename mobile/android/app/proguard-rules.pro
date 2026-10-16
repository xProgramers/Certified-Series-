# R8 rules for the release build (minifyEnabled in app/build.gradle).
# Capacitor and the plugins ship their own consumer rules; these keep the
# bridge safe even if one of them misses something.

# Capacitor bridge and plugins, found by annotation and called from the web side
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * {
    @com.getcapacitor.PluginMethod public <methods>;
    public <init>(...);
}
-keep public class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Readable crash stack traces in the Play Console
-keepattributes *Annotation*,SourceFile,LineNumberTable,Signature,InnerClasses,EnclosingMethod
-renamesourcefileattribute SourceFile
