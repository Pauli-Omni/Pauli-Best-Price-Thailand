import fs from "fs";

const path = "index.html";
let html = fs.readFileSync(path, "utf8");

html = html.replace(/\n        let idlePivotY = 0;\n/, "\n");

const beginOld = html.indexOf("        function beginWai() {");
const lipOld = html.indexOf("        /* ── LIP-SYNC + GESTURE ENGINE");
if (beginOld < 0 || lipOld < 0 || lipOld <= beginOld) {
  console.error("beginWai block not found", beginOld, lipOld);
  process.exit(1);
}

const beginNew = `        function beginWai() {
          if (avatarReturnTween) {
            avatarReturnTween.stop();
            avatarReturnTween = null;
          }
          waiActive = true;
          waiStart = performance.now();
          container.classList.add("is-wai");
        }

        function osgTweenAvatarReturn() {
          if (avatarReturnTween) avatarReturnTween.stop();
          avatarBow.rx = avatarBow.rx || 0;
          avatarBow.rz = avatarBow.rz || 0;
          avatarBow.scale = avatarBow.scale || 1;
          avatarReturnTween = new Tween(avatarBow)
            .to({ rx: 0, rz: 0, scale: 1 }, 720)
            .easing(Easing.Cubic.Out)
            .onUpdate(function () {
              osgApplyAvatarTransform(
                "rotateX(" +
                  avatarBow.rx +
                  "rad) rotateZ(" +
                  avatarBow.rz +
                  "rad) scale(" +
                  avatarBow.scale +
                  ")"
              );
            })
            .onComplete(function () {
              avatarReturnTween = null;
              container.classList.remove("is-wai");
              osgApplyAvatarTransform("");
            })
            .start();
        }

`;

html = html.slice(0, beginOld) + beginNew + html.slice(lipOld);

html = html.replace(
          `          lipSyncMeshes = [];
          coin.traverse((o) => {
            if (o.isMesh) lipSyncMeshes.push(o);
          });`,
          `          lipSyncMeshes = [avatarImg];`
);

html = html.replace(
          `          lipSyncMeshes.forEach((m) => {
            if (
              m.morphTargetInfluences &&
              m.morphTargetInfluences[0] !== undefined
            )
              m.morphTargetInfluences[0] = 0;
          });
          try {
            avatarGreeting.scale.set(1, 1, 1);
          } catch (_) {}`,
          `          lipSyncMouthLevel = 0;
          try {
            avatarImg.style.filter = "";
          } catch (_) {}`
);

html = html.replace(
          `          lipSyncMeshes.forEach((m) => {
            if (
              m.morphTargetInfluences &&
              m.morphTargetInfluences[0] !== undefined
            )
              m.morphTargetInfluences[0] = mouth;
          });
          try {
            avatarGreeting.scale.set(
              1 + mouth * 0.022,
              1 + mouth * 0.014,
              1 + mouth * 0.022
            );
          } catch (_) {}`,
          `          const pulseScale = 1 + mouth * 0.045;
          try {
            avatarImg.style.filter = "brightness(" + (1 + mouth * 0.08) + ")";
            osgApplyAvatarTransform("scale(" + pulseScale + ")");
          } catch (_) {}`
);

html = html.replace(
          `        function osgAvatarGestureStop() {
          avatarGestureType = "idle";
          if (!waiActive && !busy) {
            avatarGreeting.rotation.x = 0;
            avatarGreeting.rotation.z = 0;
            avatarGreeting.position.y = halfH + 0.02;
          }
        }`,
          `        function osgAvatarGestureStop() {
          avatarGestureType = "idle";
          if (!waiActive && !busy) {
            container.classList.remove("is-gesture");
            osgApplyAvatarTransform("");
          }
        }`
);

html = html.replace(
          `          if (avatarGestureType === "idle" && !busy && !avatarTourRunning) {
            avatarIdlePhase += delta * 1.15;
            const breathe = Math.sin(avatarIdlePhase) * 0.014;
            avatarGreeting.position.y = halfH + 0.02 + breathe;
            avatarGreeting.rotation.z =
              Math.sin(avatarIdlePhase * 0.65) * 0.028;
            return;
          }

          if (
            avatarGestureType === "confirm" ||
            avatarGestureType === "acknowledge"
          ) {
            const nod = Math.sin(t * Math.PI * 2.2) * 0.11 * (1 - t * 0.25);
            avatarGreeting.rotation.x = nod;
          } else if (avatarGestureType === "help") {
            avatarGreeting.rotation.z = Math.sin(t * Math.PI) * 0.14;
            avatarGreeting.rotation.x = -0.06 + Math.sin(t * Math.PI * 2) * 0.03;
          } else if (avatarGestureType === "greet" && !waiActive) {
            avatarGreeting.rotation.x = Math.sin(t * Math.PI) * -0.22;
          }`,
          `          if (avatarGestureType === "idle" && !busy && !avatarTourRunning) {
            avatarIdlePhase += delta * 1.15;
            const breathe = Math.sin(avatarIdlePhase) * 0.012;
            osgApplyAvatarTransform("scale(" + (1 + breathe) + ")");
            return;
          }

          if (
            avatarGestureType === "confirm" ||
            avatarGestureType === "acknowledge"
          ) {
            const nod = Math.sin(t * Math.PI * 2.2) * 8 * (1 - t * 0.25);
            osgApplyAvatarTransform("rotateX(" + nod + "deg)");
          } else if (avatarGestureType === "help") {
            const tilt = Math.sin(t * Math.PI) * 6;
            osgApplyAvatarTransform("rotateZ(" + tilt + "deg)");
          } else if (avatarGestureType === "greet" && !waiActive) {
            const bow = Math.sin(t * Math.PI) * -10;
            osgApplyAvatarTransform("rotateX(" + bow + "deg)");
          }`
);

html = html.replace(/idlePivotY = pivot\.rotation\.y;\n          beginWai\(\);/g, "beginWai();");

html = html.replace(
          `            waiActive = false;
            avatarGreeting.rotation.x = 0;
            avatarGreeting.rotation.z = 0;
            container.classList.remove("is-busy");
            osgTweenPivotReturn();`,
          `            waiActive = false;
            container.classList.remove("is-busy", "is-wai");
            osgTweenAvatarReturn();`
);

html = html.replace(/osgTweenPivotReturn\(\)/g, "osgTweenAvatarReturn()");

const canvasStart = html.indexOf("        function canvasHit(ev) {");
const installEnd = html.indexOf("        installOsgGlobalFirstGestureUnlock();");
if (canvasStart < 0 || installEnd < 0) {
  console.error("animate block not found", canvasStart, installEnd);
  process.exit(1);
}

const animateNew = `        container.addEventListener("click", () => {
          osgCoinActivateFromGesture();
        });

        container.addEventListener("keydown", (e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          osgCoinActivateFromGesture();
        });

        function animate() {
          requestAnimationFrame(animate);
          const now = performance.now();
          const delta = Math.min(0.05, 1 / 60);
          osgTweenUpdate(now);
          if (coinDebugOn && now >= coinDbgTickAt) {
            coinDbgTickAt = now + 700;
            coinDbgRender();
          }

          if (spinning && !busy) {
            spinAngle += delta * SPIN_SPEED;
          }

          osgLipSyncTick(now);
          osgAvatarGestureTick(now, delta);

          if (ttsLoading || lipSyncActive) {
            container.classList.add("is-speaking");
          } else {
            container.classList.remove("is-speaking");
          }

          if (waiActive && busy) {
            const u = Math.min(1, (now - waiStart) / WAI_MS);
            const bow = Math.sin(u * Math.PI);
            avatarBow.rx = bow * -0.28;
            avatarBow.rz = Math.sin(u * Math.PI * 2) * 0.05 * bow;
            avatarBow.scale = 1 + bow * 0.04;
            osgApplyAvatarTransform(
              "rotateX(" +
                avatarBow.rx +
                "rad) rotateZ(" +
                avatarBow.rz +
                "rad) scale(" +
                avatarBow.scale +
                ")"
            );
            if (u >= 1) {
              waiActive = false;
              container.classList.remove("is-wai");
              if (!avatarReturnTween) osgTweenAvatarReturn();
            }
          } else if (
            !busy &&
            !avatarReturnTween &&
            !avatarTourRunning &&
            !lipSyncActive &&
            avatarGestureType === "idle"
          ) {
            osgApplyAvatarTransform("");
          }
        }
        animate();

`;

html = html.slice(0, canvasStart) + animateNew + html.slice(installEnd);

// Remove leftover avatarGreeting lines
html = html.replace(/\n            avatarGreeting\.rotation\.x = 0;\n            avatarGreeting\.rotation\.z = 0;\n/g, "\n");

html = html.replace(/pivotReturnTween/g, "avatarReturnTween");

fs.writeFileSync(path, html);
console.log("patch complete");
