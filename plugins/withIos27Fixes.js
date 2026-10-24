// Config plugin: keeps the iOS project building and launching on Xcode 27 / iOS 27.
// Applied on every `expo prebuild`, so the generated ios/ folder never needs hand edits.
//   1. Raises pods below iOS 15 to 15.0 (Xcode 27 rejects lower deployment targets)
//   2. Adopts the UIScene lifecycle (iOS 27 terminates apps that don't)
const { withPodfile, withPodfileProperties, withInfoPlist, withAppDelegate } = require('expo/config-plugins')
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode')

const PODFILE_SNIPPET = `    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |bc|
        if bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < 15.0
          bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.0'
        end
      end
    end`

function withMinDeploymentTarget(config) {
  return withPodfile(config, (cfg) => {
    cfg.modResults.contents = mergeContents({
      tag: 'clickit-min-deployment-target',
      src: cfg.modResults.contents,
      newSrc: PODFILE_SNIPPET,
      anchor: /^\s*:ccache_enabled => /,
      offset: 2, // after the closing `)` of react_native_post_install(...)
      comment: '#',
    }).contents
    return cfg
  })
}

function withSceneManifest(config) {
  return withInfoPlist(config, (cfg) => {
    cfg.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    }
    return cfg
  })
}

const WINDOW_START_BLOCK = `#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif
`

const SCENE_DELEGATE = `
// [clickit-scene-delegate] iOS 27 requires the UIScene lifecycle
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
          let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }
    let window = UIWindow(windowScene: windowScene)
    self.window = window
    appDelegate.window = window
    appDelegate.reactNativeFactory?.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: appDelegate.launchOptions)
    if let url = connectionOptions.urlContexts.first?.url {
      RCTLinkingManager.application(UIApplication.shared, open: url, options: [:])
    }
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    for context in URLContexts {
      _ = UIApplication.shared.delegate?.application?(UIApplication.shared, open: context.url, options: [:])
    }
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    _ = UIApplication.shared.delegate?.application?(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
  }
}
`

function withSceneDelegate(config) {
  return withAppDelegate(config, (cfg) => {
    let src = cfg.modResults.contents
    if (src.includes('[clickit-scene-delegate]')) return cfg
    if (cfg.modResults.language !== 'swift' || !src.includes(WINDOW_START_BLOCK)) {
      throw new Error(
        '[withIos27Fixes] AppDelegate.swift no longer matches the expected Expo template — update plugins/withIos27Fixes.js'
      )
    }
    src = src.replace(
      WINDOW_START_BLOCK,
      '    // React Native is started from SceneDelegate (iOS 27 scene lifecycle)\n    self.launchOptions = launchOptions\n'
    )
    src = src.replace(
      '  var reactNativeFactory: RCTReactNativeFactory?\n',
      '  var reactNativeFactory: RCTReactNativeFactory?\n  var launchOptions: [UIApplication.LaunchOptionsKey: Any]?\n'
    )
    cfg.modResults.contents = src + SCENE_DELEGATE
    return cfg
  })
}

// Expo's downloadable precompiled modules are built with an older Swift than Xcode 27.1's,
// so build them from source (slower first build, but works with whatever Xcode is installed)
function withSourceBuiltExpoModules(config) {
  return withPodfileProperties(config, (cfg) => {
    cfg.modResults.EXPO_USE_PRECOMPILED_MODULES = 'false'
    return cfg
  })
}

module.exports = function withIos27Fixes(config) {
  return withSourceBuiltExpoModules(withSceneDelegate(withSceneManifest(withMinDeploymentTarget(config))))
}
