plugins {
  id("java")
  id("org.jetbrains.kotlin.jvm") version "1.9.25"
  id("org.jetbrains.intellij.platform") version "2.1.0"
}

group = "ai.opencode.gui"
version = "0.1.0"

repositories {
  mavenCentral()
  intellijPlatform {
    defaultRepositories()
  }
}

dependencies {
  intellijPlatform {
    // JCEF ships with the IDE; no extra dependency needed.
    intellijIdeaCommunity("2024.2")
    instrumentationTools()
  }
}

intellijPlatform {
  pluginConfiguration {
    ideaVersion {
      sinceBuild = "232"
      untilBuild = "251.*"
    }
  }
}

kotlin {
  jvmToolchain(17)
}

// The GUI is the same web bundle the VS Code extension ships. Copy the built
// output into plugin resources so the tool window can load it.
val webviewDir = layout.projectDirectory.dir("../extension/media/webview")

tasks.processResources {
  from(webviewDir) {
    into("webview")
  }
  // Fail early with a helpful message if the bundle hasn't been built yet.
  doFirst {
    if (!webviewDir.asFile.resolve("index.js").exists()) {
      throw GradleException(
        "Webview bundle not found. Run `npm run build:webview` at the repo root first.",
      )
    }
  }
}
