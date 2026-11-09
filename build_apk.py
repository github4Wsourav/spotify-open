import os
import sys
import subprocess
import shutil
import zipfile

def build():
    print("=== STARTING SPOTIFY OPEN APK BUILD PIPELINE ===")
    
    sdk_dir = os.path.expanduser('~\\AppData\\Local\\Android\\Sdk')
    android_jar = os.path.join(sdk_dir, 'platforms', 'android-37', 'android.jar')
    build_tools = os.path.join(sdk_dir, 'build-tools', '37.0.0')
    aapt2 = os.path.join(build_tools, 'aapt2.exe')
    d8 = os.path.join(build_tools, 'd8.bat')
    zipalign = os.path.join(build_tools, 'zipalign.exe')
    apksigner = os.path.join(build_tools, 'apksigner.bat')

    build_dir = os.path.abspath('android-build')
    if os.path.exists(build_dir):
        shutil.rmtree(build_dir)
    os.makedirs(build_dir, exist_ok=True)

    # 1. Create directories
    res_dir = os.path.join(build_dir, 'res')
    res_drawable = os.path.join(res_dir, 'drawable')
    res_values = os.path.join(res_dir, 'values')
    assets_target = os.path.join(build_dir, 'assets')
    src_dir = os.path.join(build_dir, 'src', 'com', 'spotify', 'open')
    bin_dir = os.path.join(build_dir, 'bin')

    for d in [res_drawable, res_values, assets_target, src_dir, bin_dir]:
        os.makedirs(d, exist_ok=True)

    # 2. Copy icon
    if os.path.exists('assets/icon-192.png'):
        shutil.copy('assets/icon-192.png', os.path.join(res_drawable, 'ic_launcher.png'))

    # 3. Create res/values/strings.xml
    with open(os.path.join(res_values, 'strings.xml'), 'w', encoding='utf-8') as f:
        f.write('''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Spotify Open</string>
</resources>
''')

    # 4. Create AndroidManifest.xml
    manifest_path = os.path.join(build_dir, 'AndroidManifest.xml')
    with open(manifest_path, 'w', encoding='utf-8') as f:
        f.write('''<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.spotify.open"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

    <application
        android:label="@string/app_name"
        android:icon="@drawable/ic_launcher"
        android:hardwareAccelerated="true"
        android:usesCleartextTraffic="true">
        <activity
            android:name="com.spotify.open.MainActivity"
            android:exported="true"
            android:configChanges="orientation|keyboardHidden|screenSize"
            android:theme="@android:style/Theme.NoTitleBar.Fullscreen">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
''')

    # 5. Copy Web Assets into assets_target
    shutil.copy('index.html', assets_target)
    shutil.copy('style.css', assets_target)
    shutil.copy('app.js', assets_target)
    shutil.copy('manifest.json', assets_target)
    shutil.copy('sw.js', assets_target)
    shutil.copytree('assets', os.path.join(assets_target, 'assets'), dirs_exist_ok=True)
    print("Copied web assets to Android build assets directory.")

    # 6. Write MainActivity.java
    java_file = os.path.join(src_dir, 'MainActivity.java')
    with open(java_file, 'w', encoding='utf-8') as f:
        f.write('''package com.spotify.open;

import android.app.Activity;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.KeyEvent;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
''')
    print("Created MainActivity.java")

    # 7. aapt2 compile resources
    compiled_res = os.path.join(build_dir, 'compiled_res.zip')
    cmd_aapt_compile = [aapt2, 'compile', '--dir', res_dir, '-o', compiled_res]
    print("Compiling resources with aapt2...")
    subprocess.run(cmd_aapt_compile, check=True)

    # 8. aapt2 link
    unaligned_apk = os.path.join(build_dir, 'unaligned.apk')
    cmd_aapt_link = [
        aapt2, 'link',
        '-I', android_jar,
        '--manifest', manifest_path,
        '-o', unaligned_apk,
        compiled_res,
        '-A', assets_target,
        '--auto-add-overlay'
    ]
    print("Linking APK with aapt2...")
    subprocess.run(cmd_aapt_link, check=True)

    # 9. Compile Java code
    print("Compiling Java code with javac...")
    javac_cmd = [
        'javac',
        '--release', '8',
        '-cp', android_jar,
        '-d', bin_dir,
        java_file
    ]
    subprocess.run(javac_cmd, check=True)

    # 10. Run d8 to convert .class to classes.dex
    print("Converting class files to Dalvik bytecode (classes.dex) with d8...")
    class_file = os.path.join(bin_dir, 'com', 'spotify', 'open', 'MainActivity.class')
    cmd_d8 = [
        'cmd.exe', '/c', d8,
        '--lib', android_jar,
        '--output', bin_dir,
        class_file
    ]
    subprocess.run(cmd_d8, check=True)

    # 11. Add classes.dex into unaligned.apk
    dex_path = os.path.join(bin_dir, 'classes.dex')
    print("Adding classes.dex into APK package...")
    with zipfile.ZipFile(unaligned_apk, 'a', compression=zipfile.ZIP_DEFLATED) as z:
        z.write(dex_path, 'classes.dex')

    # 12. Run zipalign
    aligned_apk = os.path.join(build_dir, 'aligned.apk')
    print("Aligning APK with zipalign...")
    cmd_zipalign = [zipalign, '-f', '-p', '4', unaligned_apk, aligned_apk]
    subprocess.run(cmd_zipalign, check=True)

    # 13. Generate Keystore if not exists
    keystore = os.path.abspath('spotify.keystore')
    keytool = shutil.which('keytool') or r'C:\Program Files\Java\jdk-24\bin\keytool.exe'
    if not os.path.exists(keystore):
        print(f"Generating release keystore using {keytool}...")
        cmd_keytool = [
            keytool,
            '-genkeypair',
            '-keystore', keystore,
            '-storepass', 'spotify123',
            '-alias', 'spotify_key',
            '-keypass', 'spotify123',
            '-dname', 'CN=SpotifyOpen, OU=App, O=Spotify, L=Stockholm, S=Stockholm, C=SE',
            '-keyalg', 'RSA',
            '-keysize', '2048',
            '-validity', '10000'
        ]
        subprocess.run(cmd_keytool, check=True)

    # 14. Sign with apksigner
    final_apk = 'Spotify-Open.apk'
    print("Signing APK with apksigner...")
    cmd_apksign = [
        'cmd.exe', '/c', apksigner, 'sign',
        '--ks', keystore,
        '--ks-pass', 'pass:spotify123',
        '--key-pass', 'pass:spotify123',
        '--out', final_apk,
        aligned_apk
    ]
    subprocess.run(cmd_apksign, check=True)

    # 15. Verify signature
    print("Verifying APK signature...")
    cmd_verify = ['cmd.exe', '/c', apksigner, 'verify', final_apk]
    subprocess.run(cmd_verify, check=True)

    apk_size_mb = os.path.getsize(final_apk) / (1024 * 1024)
    print(f"\nSUCCESS! Built: {final_apk} ({apk_size_mb:.2f} MB)")
    print("This APK can be installed on any Android phone!")

if __name__ == '__main__':
    build()
