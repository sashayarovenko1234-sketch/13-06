// ==================== LIQUEUR & SPIRITS ATLAS — 3D STUDIO & GLSL SHADERS (js/three-studio.js) ====================
// ==================== REALISTIC PROCEDURAL 3D BOTTLES (THREE.JS) ====================
    let threeInitTimer = null;

    let pendingThreeLiqueur = null;

    function destroyThree() {
      if (threeInitTimer) {
        clearTimeout(threeInitTimer);
        threeInitTimer = null;
      }
      if (!threeCtx) return;
      cancelAnimationFrame(threeCtx.raf);
      if (threeCtx.io) {
        threeCtx.io.disconnect();
        threeCtx.io = null;
      }
      if (threeCtx.cleanup) threeCtx.cleanup();
      const sharedEnvTex = threeCtx.envRT ? threeCtx.envRT.texture : null;
      const disposedGeos = new Set();
      const disposedMats = new Set();
      const disposedTex = new Set();
      if (threeCtx.scene) {
        threeCtx.scene.traverse(obj => {
          if (obj.geometry && !disposedGeos.has(obj.geometry)) {
            disposedGeos.add(obj.geometry);
            obj.geometry.dispose();
          }
          if (obj.material) {
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach(m => {
              if (!m || disposedMats.has(m)) return;
              disposedMats.add(m);
              ['map', 'bumpMap', 'normalMap', 'roughnessMap', 'metalnessMap', 'alphaMap', 'emissiveMap', 'clearcoatNormalMap'].forEach(prop => {
                const t = m[prop];
                if (t && t !== sharedEnvTex && !disposedTex.has(t)) {
                  disposedTex.add(t);
                  t.dispose();
                }
              });
              m.dispose();
            });
          }
        });
      }
      if (threeCtx.composer && typeof threeCtx.composer.dispose === 'function') {
        threeCtx.composer.dispose();
      }
      if (threeCtx.envRT) threeCtx.envRT.dispose();
      if (threeCtx.renderer) {
        threeCtx.renderer.dispose();
        if (threeCtx.renderer.domElement && threeCtx.renderer.domElement.parentNode) {
          threeCtx.renderer.domElement.parentNode.removeChild(threeCtx.renderer.domElement);
        }
      }
      threeCtx = null;
    }

    function createStudioEnv(renderer) {
      const pmrem = new THREE.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();
      const addons = window.__THREE_ADDONS__;
      if (addons && addons.RoomEnvironment) {
        const roomEnv = new addons.RoomEnvironment(renderer);
        const rt = pmrem.fromScene(roomEnv, 0.04);
        if (typeof roomEnv.dispose === 'function') roomEnv.dispose();
        pmrem.dispose();
        return rt;
      }
      const envScene = new THREE.Scene();
      const isDark = document.documentElement.classList.contains('speakeasy-mode');
      envScene.background = new THREE.Color(isDark ? 0x1a1612 : 0xf2ece2);

      // Studio softboxes & crisp rim strips for photorealistic glass specular highlights
      const softboxMat1 = new THREE.MeshBasicMaterial({ color: isDark ? 0xffe6bd : 0xffffff });
      const softboxMat2 = new THREE.MeshBasicMaterial({ color: isDark ? 0xffc675 : 0xfff3df });
      const rimMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const darkPanelMat = new THREE.MeshBasicMaterial({ color: isDark ? 0x0d0b09 : 0xd6cdc0 });

      const panelL = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 18), softboxMat1);
      panelL.position.set(-7, 2, 4.5);
      panelL.lookAt(0, 0, 0);
      envScene.add(panelL);

      const panelR = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 16), softboxMat2);
      panelR.position.set(7.2, 3, 3.2);
      panelR.lookAt(0, 0, 0);
      envScene.add(panelR);

      const rimStripL = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 18), rimMat);
      rimStripL.position.set(-4.2, 1, -5.5);
      rimStripL.lookAt(0, 0, 0);
      envScene.add(rimStripL);

      const rimStripR = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 18), rimMat);
      rimStripR.position.set(4.2, 1, -5.5);
      rimStripR.lookAt(0, 0, 0);
      envScene.add(rimStripR);

      const panelTop = new THREE.Mesh(new THREE.PlaneGeometry(11, 11), softboxMat1);
      panelTop.position.set(0, 9.5, 0);
      panelTop.rotation.x = Math.PI / 2;
      envScene.add(panelTop);

      const panelBack = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), darkPanelMat);
      panelBack.position.set(0, 1, -8.5);
      envScene.add(panelBack);

      const rt = pmrem.fromScene(envScene, 0.035);
      pmrem.dispose();
      return rt;
    }

    function makeLabelBumpTexture(sourceCanvas) {
      const bc = document.createElement('canvas');
      bc.width = 512; bc.height = 512;
      const bg = bc.getContext('2d');
      bg.fillStyle = '#808080';
      bg.fillRect(0, 0, 512, 512);
      // Subtle embossed border & fine paper fibers
      bg.strokeStyle = '#d8d8d8';
      bg.lineWidth = 10;
      bg.strokeRect(18, 18, 476, 476);
      bg.strokeStyle = '#505050';
      bg.lineWidth = 3;
      bg.strokeRect(32, 32, 448, 448);
      for (let i = 0; i < 650; i++) {
        const x = (i * 73) % 512;
        const y = (i * 139) % 512;
        bg.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)';
        bg.fillRect(x, y, 2, 1);
      }
      const tex = new THREE.CanvasTexture(bc);
      tex.anisotropy = 4;
      return tex;
    }

    function createRoundedRectShape(w, d, r) {
      const s = new THREE.Shape();
      const hw = w / 2, hd = d / 2;
      s.moveTo(-hw + r, -hd);
      s.lineTo(hw - r, -hd);
      s.quadraticCurveTo(hw, -hd, hw, -hd + r);
      s.lineTo(hw, hd - r);
      s.quadraticCurveTo(hw, hd, hw - r, hd);
      s.lineTo(-hw + r, hd);
      s.quadraticCurveTo(-hw, hd, -hw, hd - r);
      s.lineTo(-hw, -hd + r);
      s.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
      return s;
    }

    function makeRealisticLabelTexture(l) {
      const c = document.createElement('canvas');
      c.width = 1024;
      c.height = 1024;
      const g = c.getContext('2d');
      g.textAlign = 'center';

      if (l.id === 'cointreau') {
        g.fillStyle = '#FAF5EC';
        g.fillRect(0, 0, 1024, 1024);
        g.strokeStyle = '#C96A24';
        g.lineWidth = 22;
        g.strokeRect(36, 36, 952, 952);
        g.strokeStyle = '#1A1816';
        g.lineWidth = 6;
        g.strokeRect(66, 66, 892, 892);
        // Red diagonal ribbon & seal
        g.fillStyle = '#B8292F';
        g.beginPath(); g.arc(512, 230, 74, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#E5B869'; g.lineWidth = 6;
        g.beginPath(); g.arc(512, 230, 58, 0, Math.PI * 2); g.stroke();
        g.fillStyle = '#FAF5EC'; g.font = 'bold 34px Georgia, serif';
        g.fillText('1849', 512, 242);
        g.fillStyle = '#1A1816'; g.font = 'bold 112px Georgia, serif';
        g.fillText('COINTREAU', 512, 470);
        g.fillStyle = '#C96A24'; g.font = 'italic 54px Georgia, serif';
        g.fillText("L'Unique", 512, 555);
        g.fillStyle = '#524C46'; g.font = '600 32px Inter, sans-serif';
        g.fillText('LIQUEUR D’ORANGE · ANGERS', 512, 680);
        g.fillText('SWEET & BITTER ORANGE PEELS', 512, 740);
        g.fillStyle = '#1A1816'; g.font = 'bold 42px Inter, sans-serif';
        g.fillText('40% VOL · 700 ML', 512, 870);
      } else if (l.id === 'baileys') {
        const grad = g.createLinearGradient(0, 0, 0, 1024);
        grad.addColorStop(0, '#2B1B12');
        grad.addColorStop(0.55, '#1D120C');
        grad.addColorStop(1, '#4A2C19');
        g.fillStyle = grad;
        g.fillRect(0, 0, 1024, 1024);
        // Gold arch border
        g.strokeStyle = '#D4A86A';
        g.lineWidth = 14;
        g.strokeRect(48, 48, 928, 928);
        // Double B emblem
        g.fillStyle = '#D4A86A';
        g.beginPath(); g.arc(512, 220, 72, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#1D120C'; g.font = 'bold 64px Georgia, serif';
        g.fillText('BB', 512, 242);
        // Brand text
        g.fillStyle = '#FAF3E8'; g.font = 'bold 132px Georgia, serif';
        g.fillText('BAILEYS', 512, 465);
        g.fillStyle = '#D4A86A'; g.font = 'italic 58px Georgia, serif';
        g.fillText('The Original', 512, 560);
        // Cream swirl band
        g.fillStyle = '#E8D2B5';
        g.fillRect(140, 640, 744, 110);
        g.fillStyle = '#2B1B12'; g.font = 'bold 44px Inter, sans-serif';
        g.fillText('IRISH CREAM LIQUEUR', 512, 712);
        g.fillStyle = '#D4A86A'; g.font = '600 34px Inter, sans-serif';
        g.fillText('PRODUCT OF IRELAND · 17% VOL', 512, 880);
      } else if (l.id === 'passoa') {
        const grad = g.createLinearGradient(0, 0, 1024, 1024);
        grad.addColorStop(0, '#C81D4E');
        grad.addColorStop(0.5, '#E53955');
        grad.addColorStop(1, '#9E133B');
        g.fillStyle = grad;
        g.fillRect(0, 0, 1024, 1024);
        // Tropical gold geometric top/bottom trim
        g.fillStyle = '#F4C44E';
        g.fillRect(0, 42, 1024, 24);
        g.fillRect(0, 958, 1024, 24);
        // Stylized passion fruit motif
        g.fillStyle = '#6B1331';
        g.beginPath(); g.arc(512, 250, 96, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#F8B932';
        g.beginPath(); g.arc(512, 250, 72, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#2A1810';
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          g.beginPath();
          g.ellipse(512 + Math.cos(a) * 36, 250 + Math.sin(a) * 36, 7, 12, a, 0, Math.PI * 2);
          g.fill();
        }
        g.fillStyle = '#FFFFFF'; g.font = 'bold 136px Inter, sans-serif';
        g.fillText('PASSOÃ', 512, 535);
        g.fillStyle = '#F4C44E'; g.font = 'bold 42px Inter, sans-serif';
        g.fillText('THE PASSION DRINK', 512, 620);
        g.fillStyle = '#FFE4EC'; g.font = '500 34px Inter, sans-serif';
        g.fillText('PASSION FRUIT LIQUEUR · FRANCE', 512, 740);
        g.fillStyle = '#FFFFFF'; g.font = 'bold 40px Inter, sans-serif';
        g.fillText('17% VOL · 700 ML', 512, 865);
      } else if (l.id === 'aperol') {
        g.fillStyle = '#FAF8F5';
        g.fillRect(0, 0, 1024, 1024);
        // Cobalt blue side/top accents
        g.fillStyle = '#1B3B82';
        g.fillRect(0, 0, 1024, 150);
        g.fillRect(0, 890, 1024, 134);
        g.fillStyle = '#FAF8F5'; g.font = 'bold 44px Inter, sans-serif';
        g.fillText('DAL 1919 · PADOVA', 512, 92);
        // Orange slanted Aperol banner
        g.save();
        g.translate(512, 460);
        g.rotate(-0.08);
        g.fillStyle = '#F25A1D';
        g.fillRect(-430, -120, 860, 220);
        g.fillStyle = '#FFFFFF';
        g.font = 'bold 150px Inter, sans-serif';
        g.fillText('APEROL', 0, 42);
        g.restore();
        g.fillStyle = '#1B3B82'; g.font = 'bold 48px Georgia, serif';
        g.fillText('APERITIVO', 512, 710);
        g.fillStyle = '#524C46'; g.font = '500 32px Inter, sans-serif';
        g.fillText('BARBIERI · ITALIA', 512, 790);
        g.fillStyle = '#FAF8F5'; g.font = 'bold 42px Inter, sans-serif';
        g.fillText('11% VOL · 700 ML', 512, 972);
      } else if (l.id === 'jagermeister') {
        g.fillStyle = '#F3ECE0';
        g.fillRect(0, 0, 1024, 1024);
        // Gold + Forest green borders
        g.strokeStyle = '#C78A2B';
        g.lineWidth = 30;
        g.strokeRect(24, 24, 976, 976);
        g.strokeStyle = '#123B2B';
        g.lineWidth = 14;
        g.strokeRect(64, 64, 896, 896);
        // Medallion with stylized stag silhouette
        g.fillStyle = '#123B2B';
        g.beginPath(); g.arc(512, 290, 145, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#D98B2B'; g.lineWidth = 10;
        g.beginPath(); g.arc(512, 290, 130, 0, Math.PI * 2); g.stroke();
        // Glowing cross & antlers silhouette
        g.strokeStyle = '#F7C96E'; g.lineWidth = 10;
        g.beginPath(); g.moveTo(512, 185); g.lineTo(512, 255); g.moveTo(482, 215); g.lineTo(542, 215); g.stroke();
        g.fillStyle = '#D98B2B';
        g.beginPath(); g.arc(512, 330, 42, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#D98B2B'; g.lineWidth = 9;
        g.beginPath();
        g.moveTo(490, 300); g.lineTo(445, 240); g.lineTo(425, 255);
        g.moveTo(534, 300); g.lineTo(579, 240); g.lineTo(599, 255);
        g.stroke();
        // Orange banner with bold Gothic-inspired title
        g.fillStyle = '#D4571A';
        g.fillRect(96, 485, 832, 155);
        g.fillStyle = '#FAF5EC'; g.font = 'bold 94px Georgia, serif';
        g.fillText('Jägermeister', 512, 592);
        g.fillStyle = '#123B2B'; g.font = 'bold 38px Inter, sans-serif';
        g.fillText('56 BOTANICALS · OAK AGED', 512, 740);
        g.fillStyle = '#524C46'; g.font = '600 32px Inter, sans-serif';
        g.fillText('WOLFENBÜTTEL · GERMANY', 512, 810);
        g.fillStyle = '#123B2B'; g.font = 'bold 42px Inter, sans-serif';
        g.fillText('35% VOL · 700 ML', 512, 900);
      } else if (l.id === 'bols-triple-sec') {
        g.fillStyle = '#FFFFFF';
        g.fillRect(0, 0, 1024, 1024);
        g.strokeStyle = '#E5DDD0'; g.lineWidth = 10;
        g.strokeRect(24, 24, 976, 976);
        g.fillStyle = '#1A1816'; g.font = '600 30px Inter, sans-serif';
        g.fillText('ANNO 1575 · AMSTERDAM', 512, 145);
        g.fillStyle = '#1A1816'; g.font = 'bold 165px Georgia, serif';
        g.fillText('BOLS', 512, 345);
        // Citrus orange band
        g.fillStyle = '#E38B17';
        g.fillRect(72, 430, 880, 185);
        g.fillStyle = '#FFFFFF'; g.font = 'bold 88px Inter, sans-serif';
        g.fillText('TRIPLE SEC', 512, 552);
        g.fillStyle = '#524C46'; g.font = '600 36px Inter, sans-serif';
        g.fillText('CURAÇAO ORANGE PEEL LIQUEUR', 512, 720);
        g.fillStyle = '#1A1816'; g.font = 'bold 42px Inter, sans-serif';
        g.fillText('38% VOL · 700 ML', 512, 860);
      } else if (l.id === 'olmeca-silver' || l.id === 'olmeca-gold') {
        const isGold = l.id === 'olmeca-gold';
        g.fillStyle = isGold ? '#7C1D1A' : '#1E4E8C';
        g.fillRect(0, 0, 1024, 1024);
        g.strokeStyle = isGold ? '#E6B84C' : '#CBD5E1';
        g.lineWidth = 24;
        g.strokeRect(36, 36, 952, 952);
        // Geometric Aztec step pattern top/bottom
        g.fillStyle = isGold ? '#E6B84C' : '#93C5FD';
        for (let x = 90; x < 920; x += 90) { g.fillRect(x, 90, 48, 22); g.fillRect(x, 912, 48, 22); }
        g.fillStyle = '#FAF8F5'; g.font = 'bold 130px Georgia, serif';
        g.fillText('OLMECA', 512, 390);
        g.fillStyle = isGold ? '#F6D365' : '#BFDBFE'; g.font = 'bold 78px Inter, sans-serif';
        g.fillText(isGold ? 'GOLD' : 'SILVER', 512, 510);
        g.fillStyle = '#FAF8F5'; g.font = '600 34px Inter, sans-serif';
        g.fillText('TEQUILA · LOS ALTOS DE JALISCO', 512, 660);
        g.fillText('HECHO EN MÉXICO · NOM 1111', 512, 725);
        g.font = 'bold 42px Inter, sans-serif';
        g.fillText('35% VOL · 700 ML', 512, 845);
      } else if (l.id === 'espolon-blanco') {
        g.fillStyle = '#FAF6EE';
        g.fillRect(0, 0, 1024, 1024);
        g.strokeStyle = '#1A1816'; g.lineWidth = 22;
        g.strokeRect(32, 32, 960, 960);
        // Engraved rooster/calavera-inspired crest medallion
        g.fillStyle = '#1A1816';
        g.beginPath(); g.arc(512, 265, 130, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#D97706'; g.lineWidth = 8;
        g.beginPath(); g.arc(512, 265, 114, 0, Math.PI * 2); g.stroke();
        g.fillStyle = '#FAF6EE'; g.font = 'bold 44px Georgia, serif';
        g.fillText('100% AGAVE', 512, 278);
        g.fillStyle = '#1A1816'; g.font = 'bold 118px Georgia, serif';
        g.fillText('ESPOLÒN', 512, 520);
        g.fillStyle = '#B45309'; g.font = 'bold 58px Inter, sans-serif';
        g.fillText('BLANCO', 512, 615);
        g.fillStyle = '#3E3934'; g.font = '600 34px Inter, sans-serif';
        g.fillText('TEQUILA PURO DE AGAVE AZUL', 512, 730);
        g.fillText('CASA SAN NICOLÁS · NOM 1440', 512, 790);
        g.fillStyle = '#1A1816'; g.font = 'bold 42px Inter, sans-serif';
        g.fillText('40% VOL · 750 ML', 512, 900);
      } else if (l.id === 'absolut-vodka') {
        g.clearRect(0, 0, 1024, 1024);
        g.fillStyle = 'rgba(255,255,255,0.02)';
        g.fillRect(0, 0, 1024, 1024);
        g.fillStyle = '#1444A8'; g.font = 'bold 42px Inter, sans-serif';
        g.fillText('COUNTRY OF SWEDEN', 512, 160);
        g.font = 'bold 148px Inter, sans-serif';
        g.fillText('ABSOLUT', 512, 340);
        g.font = 'bold 118px Inter, sans-serif';
        g.fillText('VODKA', 512, 470);
        g.fillStyle = '#1A1816'; g.font = '500 30px Georgia, serif';
        g.fillText('This superb vodka was distilled from grain', 512, 595);
        g.fillText('grown in the rich fields of southern Sweden.', 512, 645);
        g.fillText('Produced & bottled in Åhus, Sweden.', 512, 695);
        g.fillStyle = '#1444A8'; g.font = 'bold 44px Inter, sans-serif';
        g.fillText('40% ALC./VOL. · 700 ML', 512, 845);
      } else if (l.id === 'jim-beam-bourbon' || l.id === 'jim-beam-apple' || l.id === 'jim-beam-honey') {
        const isApple = l.id === 'jim-beam-apple';
        const isHoney = l.id === 'jim-beam-honey';
        const bandCol = isApple ? '#4D7C0F' : (isHoney ? '#D97706' : '#1A1816');
        g.fillStyle = '#FAF8F4';
        g.fillRect(0, 0, 1024, 1024);
        g.strokeStyle = bandCol; g.lineWidth = 22;
        g.strokeRect(36, 36, 952, 952);
        g.fillStyle = bandCol;
        g.fillRect(80, 100, 864, 120);
        g.fillStyle = '#FFFFFF'; g.font = 'bold 46px Inter, sans-serif';
        g.fillText('SINCE 1795 · CLERMONT, KY', 512, 176);
        g.fillStyle = '#1A1816'; g.font = 'bold 132px Georgia, serif';
        g.fillText('JIM BEAM', 512, 390);
        g.fillStyle = bandCol; g.font = 'bold 82px Inter, sans-serif';
        g.fillText(isApple ? 'APPLE' : (isHoney ? 'HONEY' : 'BOURBON'), 512, 515);
        g.fillStyle = '#524C46'; g.font = '600 32px Inter, sans-serif';
        g.fillText(isApple ? 'GREEN APPLE LIQUEUR & BOURBON' : (isHoney ? 'NATURAL HONEY LIQUEUR & BOURBON' : 'KENTUCKY STRAIGHT BOURBON WHISKEY'), 512, 665);
        g.fillText('AGED 4 YEARS IN NEW CHARRED OAK', 512, 730);
        g.fillStyle = '#1A1816'; g.font = 'bold 44px Inter, sans-serif';
        g.fillText((isApple || isHoney ? '32.5%' : '40%') + ' VOL · 700 ML', 512, 865);
      } else if (l.id === 'jack-daniels') {
        g.fillStyle = '#121214';
        g.fillRect(0, 0, 1024, 1024);
        g.strokeStyle = '#FAF8F4'; g.lineWidth = 18;
        g.strokeRect(36, 36, 952, 952);
        g.strokeStyle = '#FAF8F4'; g.lineWidth = 4;
        g.strokeRect(66, 66, 892, 892);
        g.fillStyle = '#FAF8F4'; g.font = 'bold 104px Georgia, serif';
        g.fillText("JACK DANIEL'S", 512, 260);
        g.strokeStyle = '#FAF8F4'; g.lineWidth = 6;
        g.beginPath(); g.arc(512, 440, 105, 0, Math.PI * 2); g.stroke();
        g.font = 'bold 54px Georgia, serif';
        g.fillText('Old', 512, 418);
        g.fillText('No.7', 512, 482);
        g.font = 'bold 52px Inter, sans-serif';
        g.fillText('TENNESSEE WHISKEY', 512, 675);
        g.font = '500 30px Georgia, serif';
        g.fillText('CHARCOAL MELLOWED DROP BY DROP', 512, 750);
        g.fillText('LYNCHBURG, TENNESSEE', 512, 805);
        g.font = 'bold 42px Inter, sans-serif';
        g.fillText('40% VOL · 700 ML', 512, 900);
      } else if (l.id === 'beefeater-gin') {
        g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, 1024, 1024);
        g.strokeStyle = '#C81E2B'; g.lineWidth = 26; g.strokeRect(32, 32, 960, 960);
        g.fillStyle = '#C81E2B'; g.fillRect(76, 92, 872, 110);
        g.fillStyle = '#FFFFFF'; g.font = 'bold 48px Inter, sans-serif';
        g.fillText('LONDON DISTILLED · EST. 1820', 512, 162);
        g.fillStyle = '#1A1816'; g.font = 'bold 124px Georgia, serif';
        g.fillText('BEEFEATER', 512, 410);
        g.fillStyle = '#C81E2B'; g.font = 'bold 74px Inter, sans-serif';
        g.fillText('LONDON DRY GIN', 512, 520);
        g.fillStyle = '#524C46'; g.font = '600 34px Inter, sans-serif';
        g.fillText('9 NATURAL BOTANICALS · 24H STEEP', 512, 690);
        g.fillStyle = '#1A1816'; g.font = 'bold 44px Inter, sans-serif';
        g.fillText('40% VOL · 700 ML', 512, 865);
      } else if (l.id === 'havana-club-3') {
        g.fillStyle = '#FAF3DE'; g.fillRect(0, 0, 1024, 1024);
        g.strokeStyle = '#D49B1A'; g.lineWidth = 22; g.strokeRect(34, 34, 956, 956);
        g.fillStyle = '#C8232C'; g.beginPath(); g.arc(512, 235, 92, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#FAF3DE'; g.font = 'bold 64px Georgia, serif'; g.fillText('3', 512, 258);
        g.fillStyle = '#1A1816'; g.font = 'bold 110px Georgia, serif';
        g.fillText('HAVANA CLUB', 512, 460);
        g.fillStyle = '#C8232C'; g.font = 'bold 62px Inter, sans-serif';
        g.fillText('AÑEJO 3 AÑOS', 512, 560);
        g.fillStyle = '#524C46'; g.font = '600 34px Inter, sans-serif';
        g.fillText('EL RON DE CUBA · WHITE OAK AGED', 512, 700);
        g.fillStyle = '#1A1816'; g.font = 'bold 44px Inter, sans-serif';
        g.fillText('40% VOL · 700 ML', 512, 865);
      } else if (l.id === 'martini-rosso') {
        g.fillStyle = '#FAF6EE'; g.fillRect(0, 0, 1024, 1024);
        g.strokeStyle = '#8C1D2C'; g.lineWidth = 24; g.strokeRect(32, 32, 960, 960);
        g.fillStyle = '#C81E2B'; g.beginPath(); g.arc(512, 330, 175, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#141414'; g.fillRect(140, 275, 744, 115);
        g.fillStyle = '#FFFFFF'; g.font = 'bold 104px Georgia, serif';
        g.fillText('MARTINI', 512, 365);
        g.fillStyle = '#8C1D2C'; g.font = 'bold 84px Georgia, serif';
        g.fillText('ROSSO', 512, 645);
        g.fillStyle = '#524C46'; g.font = '600 34px Inter, sans-serif';
        g.fillText('VERMOUTH · TORINO DAL 1863', 512, 745);
        g.fillStyle = '#1A1816'; g.font = 'bold 42px Inter, sans-serif';
        g.fillText('15% VOL · 750 ML', 512, 875);
      } else if (l.id === 'campari') {
        g.fillStyle = '#FAF5EC'; g.fillRect(0, 0, 1024, 1024);
        g.strokeStyle = '#D1192A'; g.lineWidth = 18; g.strokeRect(34, 34, 956, 956);
        g.fillStyle = '#D1192A'; g.fillRect(72, 160, 880, 185);
        g.fillStyle = '#FFFFFF'; g.font = 'bold 126px Georgia, serif';
        g.fillText('CAMPARI', 512, 294);
        g.fillStyle = '#1A1816'; g.font = 'bold 82px Inter, sans-serif';
        g.fillText('BITTER', 512, 495);
        g.fillStyle = '#7E0C17'; g.font = 'italic 44px Georgia, serif';
        g.fillText('Milano · Dal 1860', 512, 585);
        g.fillStyle = '#524C46'; g.font = '600 32px Inter, sans-serif';
        g.fillText('APERITIVO ITALIANO', 512, 710);
        g.fillStyle = '#1A1816'; g.font = 'bold 44px Inter, sans-serif';
        g.fillText('25% VOL · 700 ML', 512, 865);
      } else {
        // Bols Creme de Cassis
        g.fillStyle = '#FFFFFF';
        g.fillRect(0, 0, 1024, 1024);
        g.strokeStyle = '#E5DDD0'; g.lineWidth = 10;
        g.strokeRect(24, 24, 976, 976);
        g.fillStyle = '#1A1816'; g.font = '600 30px Inter, sans-serif';
        g.fillText('ANNO 1575 · AMSTERDAM', 512, 145);
        g.fillStyle = '#1A1816'; g.font = 'bold 165px Georgia, serif';
        g.fillText('BOLS', 512, 345);
        // Deep cassis berry band
        g.fillStyle = '#5B1B4A';
        g.fillRect(72, 430, 880, 185);
        g.fillStyle = '#FFFFFF'; g.font = 'bold 72px Inter, sans-serif';
        g.fillText('CRÈME DE CASSIS', 512, 548);
        // Small berry illustration
        g.fillStyle = '#3B0F30';
        [[465, 710], [512, 730], [558, 705], [492, 675], [534, 678]].forEach(([bx, by]) => {
          g.beginPath(); g.arc(bx, by, 22, 0, Math.PI * 2); g.fill();
        });
        g.fillStyle = '#1A1816'; g.font = 'bold 42px Inter, sans-serif';
        g.fillText('17% VOL · 700 ML', 512, 865);
      }

      // Stage 5: Subtle tactile paper grain + diagonal metallic foil sheen on Canvas label
      if (l.id !== 'absolut-vodka') {
        const sheen = g.createLinearGradient(0, 0, 1024, 1024);
        sheen.addColorStop(0, 'rgba(255,255,255,0.06)');
        sheen.addColorStop(0.45, 'rgba(255,248,230,0.0)');
        sheen.addColorStop(0.55, 'rgba(255,240,200,0.08)');
        sheen.addColorStop(1, 'rgba(0,0,0,0.08)');
        g.fillStyle = sheen;
        g.fillRect(0, 0, 1024, 1024);
      }

      const tex = new THREE.CanvasTexture(c);
      if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      return tex;
    }

    function buildBottleMeshGroup(l, envMap) {
      const group = new THREE.Group();
      const labelTex = makeRealisticLabelTexture(l);
      const labelBump = makeLabelBumpTexture(labelTex.image);
      const labelMat = new THREE.MeshStandardMaterial({
        map: labelTex,
        bumpMap: labelBump,
        bumpScale: 0.012,
        roughness: 0.36,
        metalness: 0.14,
        envMap: envMap,
        envMapIntensity: 0.95
      });

      const makeGlassMat = (hex, opacity, rough, trans) => {
        const isDarkTinted = opacity > 0.7;
        const transVal = trans ? (isDarkTinted ? Math.max(0.28, 1.0 - opacity * 0.55) : Math.min(0.92, Math.max(0.76, 1.08 - opacity * 0.65))) : 0.0;
        const mat = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(trans && !isDarkTinted ? '#FFFFFF' : hex),
          roughness: Math.max(0.03, rough * 0.75),
          metalness: 0.0,
          ior: 1.52,
          thickness: isDarkTinted ? 0.62 : 0.48,
          attenuationColor: new THREE.Color(hex),
          attenuationDistance: isDarkTinted ? 0.75 : 1.4,
          clearcoat: 1.0,
          clearcoatRoughness: 0.03,
          reflectivity: 1.0,
          transmission: transVal,
          envMap: envMap,
          envMapIntensity: 1.65,
          transparent: false,
          opacity: 1.0
        });
        mat.userData.isGlass = !!trans;
        mat.userData.baseRoughness = mat.roughness;
        return mat;
      };

      const makeMetalMat = (hex, rough) => new THREE.MeshStandardMaterial({
        color: new THREE.Color(hex),
        roughness: rough,
        metalness: 0.82,
        envMap: envMap,
        envMapIntensity: 1.25
      });

      const makeLiquidMat = (hex, emissiveHex) => {
        const mat = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(hex),
          emissive: new THREE.Color(emissiveHex || 0x000000),
          emissiveIntensity: emissiveHex ? 0.18 : 0,
          roughness: 0.12,
          metalness: 0.0,
          clearcoat: 0.6,
          envMap: envMap
        });
        mat.userData.isLiquid = true;
        return mat;
      };

      if (l.id === 'cointreau') {
        // Iconic rounded-square amber bottle
        const outerShape = createRoundedRectShape(1.12, 1.12, 0.18);
        const bodyGeo = new THREE.ExtrudeGeometry(outerShape, {
          depth: 1.72, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 5
        });
        bodyGeo.rotateX(-Math.PI / 2);
        const glassMat = makeGlassMat('#7B3611', 0.88, 0.1, true);
        const body = new THREE.Mesh(bodyGeo, glassMat);
        body.position.y = -1.28;
        group.add(body);

        // Inner liquid
        const liqShape = createRoundedRectShape(0.96, 0.96, 0.14);
        const liqGeo = new THREE.ExtrudeGeometry(liqShape, { depth: 1.56, steps: 6, curveSegments: 16, bevelEnabled: false });
        liqGeo.rotateX(-Math.PI / 2);
        const liq = new THREE.Mesh(liqGeo, makeLiquidMat('#A04A14', '#4A1D04'));
        liq.position.y = -1.2;
        group.add(liq);

        // Rounded stepped shoulder + neck
        const neckPts = [
          new THREE.Vector2(0.56, 0.44),
          new THREE.Vector2(0.42, 0.66),
          new THREE.Vector2(0.24, 0.80),
          new THREE.Vector2(0.22, 1.28),
          new THREE.Vector2(0.24, 1.32)
        ];
        const neck = new THREE.Mesh(new THREE.LatheGeometry(neckPts, 48), glassMat);
        group.add(neck);

        // Copper neck foil & cap
        const copperMat = makeMetalMat('#C87D4B', 0.24);
        const foil = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.245, 0.42, 36), copperMat);
        foil.position.y = 1.18;
        group.add(foil);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.22, 36), makeMetalMat('#B56A39', 0.28));
        cap.position.y = 1.48;
        group.add(cap);

        // Front label
        const frontLbl = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 1.05), labelMat);
        frontLbl.position.set(0, -0.35, 0.625);
        group.add(frontLbl);
      } else if (l.id === 'jagermeister') {
        // Authentic flat emerald-green apothecary flask with real front & back labels
        const outerShape = createRoundedRectShape(1.16, 0.56, 0.11);
        const bodyGeo = new THREE.ExtrudeGeometry(outerShape, {
          depth: 1.94, bevelEnabled: true, bevelThickness: 0.09, bevelSize: 0.06, bevelSegments: 6
        });
        bodyGeo.rotateX(-Math.PI / 2);
        const darkGlassMat = makeGlassMat('#092B1B', 0.96, 0.08, true);
        const body = new THREE.Mesh(bodyGeo, darkGlassMat);
        body.position.y = -1.36;
        group.add(body);

        // Inner dark herbal elixir
        const liqShape = createRoundedRectShape(1.02, 0.44, 0.08);
        const liqGeo = new THREE.ExtrudeGeometry(liqShape, { depth: 1.82, steps: 6, curveSegments: 16, bevelEnabled: false });
        liqGeo.rotateX(-Math.PI / 2);
        const liq = new THREE.Mesh(liqGeo, makeLiquidMat('#1A0B04'));
        liq.position.y = -1.28;
        group.add(liq);

        // Glowing bright emerald-green glass neck (matches real bottle photo!)
        const brightGreenGlass = makeGlassMat('#14783A', 0.78, 0.07, true);
        const neckPts = [
          new THREE.Vector2(0.32, 0.58),
          new THREE.Vector2(0.24, 0.74),
          new THREE.Vector2(0.185, 0.90),
          new THREE.Vector2(0.185, 1.24),
          new THREE.Vector2(0.20, 1.28)
        ];
        group.add(new THREE.Mesh(new THREE.LatheGeometry(neckPts, 48), brightGreenGlass));

        // Authentic dark-green screw cap with 'Curt Mast' signature + orange-red band + champagne knurled top
        const capCanvas = document.createElement('canvas');
        capCanvas.width = 512; capCanvas.height = 256;
        const cg = capCanvas.getContext('2d');
        cg.fillStyle = '#0B3522';
        cg.fillRect(0, 0, 512, 256);
        cg.fillStyle = '#D9411A';
        cg.fillRect(0, 172, 512, 34);
        cg.fillStyle = '#E8D5A8';
        cg.font = 'italic 44px Georgia, serif';
        cg.textAlign = 'center';
        cg.fillText('Curt Mast', 128, 128);
        cg.fillText('Curt Mast', 384, 128);
        cg.font = 'bold 20px Inter, sans-serif';
        cg.fillStyle = '#FAF5EC';
        cg.fillText('SEIT 1878', 128, 196);
        cg.fillText('SEIT 1878', 384, 196);
        const capTex = new THREE.CanvasTexture(capCanvas);
        capTex.wrapS = THREE.RepeatWrapping;
        const capSideMat = new THREE.MeshStandardMaterial({ map: capTex, roughness: 0.28, metalness: 0.65, envMap: envMap });
        const capCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.208, 0.212, 0.42, 48, 1, true), capSideMat);
        capCyl.position.y = 1.38;
        group.add(capCyl);

        // Champagne-gold ribbed top lid
        const lidMat = makeMetalMat('#D6C49A', 0.28);
        const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.212, 0.212, 0.06, 48), lidMat);
        lid.position.y = 1.61;
        group.add(lid);

        // Real photo front & back die-cut labels (loaded from embedded PNG data URIs)
        const loader = new THREE.TextureLoader();
        const frontTex = loader.load(REAL_LABELS.jagermeister.front);
        if (THREE.SRGBColorSpace) frontTex.colorSpace = THREE.SRGBColorSpace;
        frontTex.anisotropy = 8;
        const backTex = loader.load(REAL_LABELS.jagermeister.back);
        if (THREE.SRGBColorSpace) backTex.colorSpace = THREE.SRGBColorSpace;
        backTex.anisotropy = 8;

        const frontMat = new THREE.MeshStandardMaterial({ map: frontTex, transparent: true, alphaTest: 0.05, roughness: 0.48, metalness: 0.04 });
        const backMat = new THREE.MeshStandardMaterial({ map: backTex, transparent: true, alphaTest: 0.05, roughness: 0.48, metalness: 0.04 });

        const frontLbl = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 1.72), frontMat);
        frontLbl.position.set(0, -0.37, 0.344);
        group.add(frontLbl);

        const backLbl = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 1.70), backMat);
        backLbl.position.set(0, -0.37, -0.344);
        backLbl.rotation.y = Math.PI;
        group.add(backLbl);
      } else if (l.id === 'aperol') {
        // Iconic sculpted Italian bottle with clear glass + luminous orange liquid
        const outerPts = [
          new THREE.Vector2(0.0, -1.42),
          new THREE.Vector2(0.46, -1.42),
          new THREE.Vector2(0.54, -1.32),
          new THREE.Vector2(0.51, -0.75),
          new THREE.Vector2(0.48, -0.25),
          new THREE.Vector2(0.57, 0.18),
          new THREE.Vector2(0.55, 0.42),
          new THREE.Vector2(0.34, 0.68),
          new THREE.Vector2(0.19, 0.90),
          new THREE.Vector2(0.18, 1.48),
          new THREE.Vector2(0.20, 1.54)
        ];
        const liqPts = [
          new THREE.Vector2(0.0, -1.32),
          new THREE.Vector2(0.46, -1.30),
          new THREE.Vector2(0.45, -0.75),
          new THREE.Vector2(0.43, -0.25),
          new THREE.Vector2(0.51, 0.18),
          new THREE.Vector2(0.48, 0.39),
          new THREE.Vector2(0.29, 0.62),
          new THREE.Vector2(0.15, 0.85),
          new THREE.Vector2(0.10, 0.85),
          new THREE.Vector2(0.05, 0.85),
          new THREE.Vector2(0.0, 0.85)
        ];
        const clearGlass = makeGlassMat('#FFF4EB', 0.34, 0.05, true);
        const orangeLiq = makeLiquidMat('#FF5314', '#D93400');
        group.add(new THREE.Mesh(new THREE.LatheGeometry(liqPts, 56), orangeLiq));
        group.add(new THREE.Mesh(new THREE.LatheGeometry(outerPts, 56), clearGlass));

        // Royal blue neck foil & cap
        const blueMat = makeMetalMat('#1A3B8A', 0.32);
        const neckFoil = new THREE.Mesh(new THREE.CylinderGeometry(0.195, 0.205, 0.36, 36), blueMat);
        neckFoil.position.y = 1.24;
        group.add(neckFoil);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.24, 36), blueMat);
        cap.position.y = 1.55;
        group.add(cap);

        // Curved front label
        const lbl = new THREE.Mesh(new THREE.CylinderGeometry(0.522, 0.515, 0.95, 48, 1, true, -0.82, 1.64), labelMat);
        lbl.position.y = -0.45;
        group.add(lbl);
      } else if (l.id === 'baileys') {
        // Iconic dark-chocolate opaque curved bottle
        const pts = [
          new THREE.Vector2(0.0, -1.42),
          new THREE.Vector2(0.48, -1.42),
          new THREE.Vector2(0.54, -1.30),
          new THREE.Vector2(0.52, -0.35),
          new THREE.Vector2(0.54, 0.24),
          new THREE.Vector2(0.46, 0.54),
          new THREE.Vector2(0.24, 0.78),
          new THREE.Vector2(0.20, 1.38),
          new THREE.Vector2(0.22, 1.44)
        ];
        const darkGlass = makeGlassMat('#1A110C', 1.0, 0.14, false);
        group.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 56), darkGlass));

        // Gold neck collar & dark cap
        const goldMat = makeMetalMat('#C89A58', 0.25);
        const neckFoil = new THREE.Mesh(new THREE.CylinderGeometry(0.212, 0.222, 0.44, 36), goldMat);
        neckFoil.position.y = 1.18;
        group.add(neckFoil);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.24, 36), makeMetalMat('#231610', 0.35));
        cap.position.y = 1.50;
        group.add(cap);

        // Curved front label
        const lbl = new THREE.Mesh(new THREE.CylinderGeometry(0.542, 0.532, 1.08, 48, 1, true, -0.9, 1.8), labelMat);
        lbl.position.y = -0.38;
        group.add(lbl);
      } else if (l.id === 'passoa') {
        // Iconic tall sleek matte-black tapered bottle
        const pts = [
          new THREE.Vector2(0.0, -1.46),
          new THREE.Vector2(0.44, -1.46),
          new THREE.Vector2(0.49, -1.36),
          new THREE.Vector2(0.48, 0.26),
          new THREE.Vector2(0.41, 0.58),
          new THREE.Vector2(0.22, 0.88),
          new THREE.Vector2(0.18, 1.48),
          new THREE.Vector2(0.19, 1.54)
        ];
        const matteBlack = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#141417'),
          roughness: 0.42,
          metalness: 0.08,
          clearcoat: 0.25,
          envMap: envMap
        });
        group.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 56), matteBlack));

        // Glossy black cap + gold ring
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.195, 0.20, 0.38, 36), makeGlassMat('#111113', 1.0, 0.12, false));
        cap.position.y = 1.42;
        group.add(cap);
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.05, 36), makeMetalMat('#E5B84B', 0.22));
        ring.position.y = 1.22;
        group.add(ring);

        // Vibrant wrap label
        const lbl = new THREE.Mesh(new THREE.CylinderGeometry(0.492, 0.492, 1.18, 56, 1, true, -1.15, 2.3), labelMat);
        lbl.position.y = -0.44;
        group.add(lbl);
      } else if (l.id === 'olmeca-silver' || l.id === 'olmeca-gold') {
        const isGold = l.id === 'olmeca-gold';
        const outerShape = createRoundedRectShape(1.12, 1.12, 0.14);
        const bodyGeo = new THREE.ExtrudeGeometry(outerShape, { depth: 1.72, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 4 });
        bodyGeo.rotateX(-Math.PI / 2);
        const clearGlass = makeGlassMat('#F6FAFD', 0.36, 0.06, true);
        const body = new THREE.Mesh(bodyGeo, clearGlass);
        body.position.y = -1.3;
        group.add(body);
        const liqShape = createRoundedRectShape(0.96, 0.96, 0.11);
        const liqGeo = new THREE.ExtrudeGeometry(liqShape, { depth: 1.56, steps: 6, curveSegments: 16, bevelEnabled: false });
        liqGeo.rotateX(-Math.PI / 2);
        const liqMat = isGold ? makeLiquidMat('#D99B26', '#8C5208') : makeLiquidMat('#DCEBF8', '#8AB4D8');
        const liq = new THREE.Mesh(liqGeo, liqMat);
        liq.position.y = -1.22;
        group.add(liq);
        const neckPts = [new THREE.Vector2(0.54, 0.42), new THREE.Vector2(0.36, 0.68), new THREE.Vector2(0.22, 0.85), new THREE.Vector2(0.21, 1.36)];
        group.add(new THREE.Mesh(new THREE.LatheGeometry(neckPts, 44), clearGlass));
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.32, 36), makeMetalMat(isGold ? '#C89228' : '#1E4E8C', 0.28));
        cap.position.y = 1.46;
        group.add(cap);
        const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.94, 1.08), labelMat);
        lbl.position.set(0, -0.36, 0.625);
        group.add(lbl);
      } else if (l.id === 'espolon-blanco') {
        const outerPts = [
          new THREE.Vector2(0.0, -1.42), new THREE.Vector2(0.50, -1.42), new THREE.Vector2(0.58, -1.28),
          new THREE.Vector2(0.56, 0.24), new THREE.Vector2(0.46, 0.56), new THREE.Vector2(0.22, 0.82),
          new THREE.Vector2(0.20, 1.34), new THREE.Vector2(0.23, 1.40)
        ];
        const liqPts = [
          new THREE.Vector2(0.0, -1.32), new THREE.Vector2(0.49, -1.30), new THREE.Vector2(0.50, 0.24),
          new THREE.Vector2(0.40, 0.50), new THREE.Vector2(0.18, 0.72), new THREE.Vector2(0.12, 0.72), new THREE.Vector2(0.06, 0.72), new THREE.Vector2(0.0, 0.72)
        ];
        const clearGlass = makeGlassMat('#F8FAFC', 0.34, 0.05, true);
        const liqMat = makeLiquidMat('#DCE8F4', '#8FAEC8');
        group.add(new THREE.Mesh(new THREE.LatheGeometry(liqPts, 52), liqMat));
        group.add(new THREE.Mesh(new THREE.LatheGeometry(outerPts, 52), clearGlass));
        const woodCork = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.24, 0.26, 36), makeMetalMat('#2D2118', 0.65));
        woodCork.position.y = 1.50;
        group.add(woodCork);
        const lbl = new THREE.Mesh(new THREE.CylinderGeometry(0.574, 0.574, 1.15, 48, 1, true, -0.92, 1.84), labelMat);
        lbl.position.y = -0.45;
        group.add(lbl);
      } else if (l.id === 'absolut-vodka') {
        // Iconic Swedish apothecary cylinder with short stubby neck
        const outerPts = [
          new THREE.Vector2(0.0, -1.40), new THREE.Vector2(0.52, -1.40), new THREE.Vector2(0.58, -1.26),
          new THREE.Vector2(0.58, 0.46), new THREE.Vector2(0.50, 0.70), new THREE.Vector2(0.23, 0.86),
          new THREE.Vector2(0.21, 1.24), new THREE.Vector2(0.22, 1.30)
        ];
        const liqPts = [
          new THREE.Vector2(0.0, -1.28), new THREE.Vector2(0.51, -1.26), new THREE.Vector2(0.52, 0.44),
          new THREE.Vector2(0.42, 0.64), new THREE.Vector2(0.18, 0.80), new THREE.Vector2(0.12, 0.80), new THREE.Vector2(0.06, 0.80), new THREE.Vector2(0.0, 0.80)
        ];
        const clearGlass = makeGlassMat('#F5FAFF', 0.32, 0.04, true);
        const liqMat = makeLiquidMat('#E0EFFC', '#8CB8DF');
        group.add(new THREE.Mesh(new THREE.LatheGeometry(liqPts, 56), liqMat));
        group.add(new THREE.Mesh(new THREE.LatheGeometry(outerPts, 56), clearGlass));
        const silverCap = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.34, 40), makeMetalMat('#D4DBE3', 0.2));
        silverCap.position.y = 1.38;
        group.add(silverCap);
        const printMat = new THREE.MeshStandardMaterial({ map: labelTex, transparent: true, roughness: 0.3, metalness: 0.05 });
        const lbl = new THREE.Mesh(new THREE.CylinderGeometry(0.586, 0.586, 1.32, 52, 1, true, -0.95, 1.9), printMat);
        lbl.position.y = -0.36;
        group.add(lbl);
      } else if (l.id === 'jim-beam-bourbon' || l.id === 'jim-beam-apple' || l.id === 'jim-beam-honey' || l.id === 'jack-daniels') {
        // Iconic American square whiskey/bourbon bottles
        const isJack = l.id === 'jack-daniels';
        const isApple = l.id === 'jim-beam-apple';
        const isHoney = l.id === 'jim-beam-honey';
        const outerShape = createRoundedRectShape(1.06, 1.06, isJack ? 0.10 : 0.13);
        const bodyGeo = new THREE.ExtrudeGeometry(outerShape, { depth: 1.88, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.05, bevelSegments: 4 });
        bodyGeo.rotateX(-Math.PI / 2);
        const clearGlass = makeGlassMat('#FAF5EE', 0.35, 0.06, true);
        const body = new THREE.Mesh(bodyGeo, clearGlass);
        body.position.y = -1.36;
        group.add(body);
        const liqShape = createRoundedRectShape(0.92, 0.92, 0.09);
        const liqGeo = new THREE.ExtrudeGeometry(liqShape, { depth: 1.72, steps: 6, curveSegments: 16, bevelEnabled: false });
        liqGeo.rotateX(-Math.PI / 2);
        const liqHex = isJack ? '#8F3E0A' : (isApple ? '#C88D22' : (isHoney ? '#D68910' : '#B45309'));
        const liq = new THREE.Mesh(liqGeo, makeLiquidMat(liqHex, '#4A1D03'));
        liq.position.y = -1.28;
        group.add(liq);
        const neckPts = [new THREE.Vector2(0.52, 0.52), new THREE.Vector2(0.32, 0.78), new THREE.Vector2(0.20, 0.96), new THREE.Vector2(0.195, 1.44)];
        group.add(new THREE.Mesh(new THREE.LatheGeometry(neckPts, 44), clearGlass));
        const capCol = isJack ? '#141416' : (isApple ? '#3F6B0E' : (isHoney ? '#C87A0B' : '#1B1A18'));
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.215, 0.22, 0.42, 36), makeMetalMat(capCol, 0.32));
        cap.position.y = 1.42;
        group.add(cap);
        const frontLbl = new THREE.Mesh(new THREE.PlaneGeometry(0.94, 1.18), labelMat);
        frontLbl.position.set(0, -0.42, 0.586);
        group.add(frontLbl);
      } else if (l.id === 'beefeater-gin') {
        const outerShape = createRoundedRectShape(0.98, 0.78, 0.12);
        const bodyGeo = new THREE.ExtrudeGeometry(outerShape, { depth: 1.78, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.05, bevelSegments: 5 });
        bodyGeo.rotateX(-Math.PI / 2);
        const clearGlass = makeGlassMat('#F2F7FA', 0.34, 0.05, true);
        const liqShape = createRoundedRectShape(0.84, 0.64, 0.09);
        const liqGeo = new THREE.ExtrudeGeometry(liqShape, { depth: 1.62, steps: 6, curveSegments: 16, bevelEnabled: false });
        liqGeo.rotateX(-Math.PI / 2);
        const liq = new THREE.Mesh(liqGeo, makeLiquidMat('#E2F0FA', '#92B7D4'));
        liq.position.y = -1.24; group.add(liq);
        const body = new THREE.Mesh(bodyGeo, clearGlass);
        body.position.y = -1.32; group.add(body);
        const neckPts = [new THREE.Vector2(0.42, 0.46), new THREE.Vector2(0.24, 0.78), new THREE.Vector2(0.20, 1.32), new THREE.Vector2(0.22, 1.38)];
        group.add(new THREE.Mesh(new THREE.LatheGeometry(neckPts, 48), clearGlass));
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.215, 0.215, 0.42, 36), makeMetalMat('#B81D24', 0.25));
        cap.position.y = 1.44; group.add(cap);
        const frontLbl = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 1.02), labelMat);
        frontLbl.position.set(0, -0.35, 0.445); group.add(frontLbl);
      } else if (l.id === 'havana-club-3') {
        const outerPts = [new THREE.Vector2(0, -1.42), new THREE.Vector2(0.44, -1.42), new THREE.Vector2(0.49, -1.32), new THREE.Vector2(0.49, 0.32), new THREE.Vector2(0.38, 0.64), new THREE.Vector2(0.20, 0.92), new THREE.Vector2(0.18, 1.48)];
        const liqPts = [new THREE.Vector2(0, -1.34), new THREE.Vector2(0.42, -1.32), new THREE.Vector2(0.42, 0.30), new THREE.Vector2(0.31, 0.58), new THREE.Vector2(0.16, 0.85), new THREE.Vector2(0.10, 0.85), new THREE.Vector2(0.05, 0.85), new THREE.Vector2(0, 0.85)];
        const clearGlass = makeGlassMat('#FAF7F0', 0.32, 0.05, true);
        group.add(new THREE.Mesh(new THREE.LatheGeometry(liqPts, 52), makeLiquidMat('#EAD8A0', '#8A6D22')));
        group.add(new THREE.Mesh(new THREE.LatheGeometry(outerPts, 52), clearGlass));
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.195, 0.20, 0.38, 36), makeMetalMat('#C8232C', 0.28));
        cap.position.y = 1.46; group.add(cap);
        const lbl = new THREE.Mesh(new THREE.CylinderGeometry(0.498, 0.498, 0.96, 48, 1, true, -0.85, 1.7), labelMat);
        lbl.position.y = -0.38; group.add(lbl);
      } else if (l.id === 'martini-rosso') {
        const pts = [new THREE.Vector2(0, -1.44), new THREE.Vector2(0.45, -1.44), new THREE.Vector2(0.51, -1.32), new THREE.Vector2(0.51, 0.22), new THREE.Vector2(0.40, 0.58), new THREE.Vector2(0.20, 0.92), new THREE.Vector2(0.18, 1.52)];
        const darkGreen = makeGlassMat('#1A2B16', 0.96, 0.08, true);
        group.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 52), darkGreen));
        const foil = new THREE.Mesh(new THREE.CylinderGeometry(0.195, 0.205, 0.48, 36), makeMetalMat('#9E1B24', 0.3));
        foil.position.y = 1.38; group.add(foil);
        const lbl = new THREE.Mesh(new THREE.CylinderGeometry(0.518, 0.518, 0.98, 48, 1, true, -0.88, 1.76), labelMat);
        lbl.position.y = -0.40; group.add(lbl);
      } else if (l.id === 'campari') {
        const outerPts = [new THREE.Vector2(0, -1.44), new THREE.Vector2(0.46, -1.44), new THREE.Vector2(0.51, -1.34), new THREE.Vector2(0.51, 0.30), new THREE.Vector2(0.42, 0.62), new THREE.Vector2(0.20, 0.90), new THREE.Vector2(0.18, 1.50)];
        const liqPts = [new THREE.Vector2(0, -1.35), new THREE.Vector2(0.44, -1.33), new THREE.Vector2(0.44, 0.28), new THREE.Vector2(0.35, 0.56), new THREE.Vector2(0.16, 0.84), new THREE.Vector2(0.10, 0.84), new THREE.Vector2(0.05, 0.84), new THREE.Vector2(0, 0.84)];
        const clearGlass = makeGlassMat('#FFF4F5', 0.30, 0.05, true);
        group.add(new THREE.Mesh(new THREE.LatheGeometry(liqPts, 52), makeLiquidMat('#D41124', '#8A0614')));
        group.add(new THREE.Mesh(new THREE.LatheGeometry(outerPts, 52), clearGlass));
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.195, 0.20, 0.42, 36), makeMetalMat('#1C1B1A', 0.38));
        cap.position.y = 1.44; group.add(cap);
        const lbl = new THREE.Mesh(new THREE.CylinderGeometry(0.518, 0.518, 0.94, 48, 1, true, -0.85, 1.7), labelMat);
        lbl.position.y = -0.35; group.add(lbl);
      } else {
        // Bols Triple Sec & Bols Creme de Cassis — authentic ergonomic bartender bottle with indented waist grip
        const isCassis = l.id === 'bols-cassis';
        const outerPts = [
          new THREE.Vector2(0.0, -1.44),
          new THREE.Vector2(0.46, -1.44),
          new THREE.Vector2(0.52, -1.32),
          new THREE.Vector2(0.51, -0.78),
          new THREE.Vector2(0.44, -0.42), // iconic bartender grip indent
          new THREE.Vector2(0.51, -0.02),
          new THREE.Vector2(0.54, 0.28),
          new THREE.Vector2(0.46, 0.56),
          new THREE.Vector2(0.21, 0.84),
          new THREE.Vector2(0.18, 1.48),
          new THREE.Vector2(0.195, 1.54)
        ];
        const liqPts = [
          new THREE.Vector2(0.0, -1.34),
          new THREE.Vector2(0.45, -1.32),
          new THREE.Vector2(0.45, -0.78),
          new THREE.Vector2(0.39, -0.42),
          new THREE.Vector2(0.45, -0.02),
          new THREE.Vector2(0.48, 0.28),
          new THREE.Vector2(0.39, 0.52),
          new THREE.Vector2(0.17, 0.78),
          new THREE.Vector2(0.11, 0.78),
          new THREE.Vector2(0.05, 0.78),
          new THREE.Vector2(0.0, 0.78)
        ];
        const clearGlass = makeGlassMat(isCassis ? '#F5EBF2' : '#F4F8FA', isCassis ? 0.32 : 0.36, 0.05, true);
        const liqMat = isCassis
          ? makeLiquidMat('#3E0B30', '#1E0318')
          : makeLiquidMat('#E2EEF8', '#9BBAD4');
        group.add(new THREE.Mesh(new THREE.LatheGeometry(liqPts, 56), liqMat));
        group.add(new THREE.Mesh(new THREE.LatheGeometry(outerPts, 56), clearGlass));

        // Matte black Bols neck sleeve & cap
        const blackSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.195, 0.205, 0.56, 36), makeMetalMat('#1C1B1A', 0.45));
        blackSleeve.position.y = 1.28;
        group.add(blackSleeve);

        // Front label sits cleanly on upper-middle chest
        const lbl = new THREE.Mesh(new THREE.CylinderGeometry(0.538, 0.502, 0.72, 48, 1, true, -0.85, 1.7), labelMat);
        lbl.position.y = 0.05;
        group.add(lbl);
      }

      // Stage 4 Sculptural Polish: heavy glass base punt ring + embossed neck collar for crisp specular highlights
      const isSquareBottle = ['cointreau', 'jagermeister', 'olmeca-silver', 'olmeca-gold', 'jim-beam-bourbon', 'jim-beam-apple', 'jim-beam-honey', 'jack-daniels', 'beefeater-gin'].includes(l.id);
      const trimMetal = makeMetalMat(l.accent || '#D6B882', 0.22);
      const collarRing = new THREE.Mesh(
        new THREE.TorusGeometry(isSquareBottle ? 0.225 : 0.205, 0.018, 16, 48),
        trimMetal
      );
      collarRing.rotation.x = Math.PI / 2;
      collarRing.position.y = l.id === 'absolut-vodka' ? 1.18 : 1.24;
      collarRing.renderOrder = 3;
      group.add(collarRing);

      const clearRoundBottles = ['aperol', 'campari', 'espolon-blanco', 'absolut-vodka', 'havana-club-3', 'bols-triple-sec', 'bols-cassis'];
      if (clearRoundBottles.includes(l.id)) {
        const puntGlass = makeGlassMat('#FFFFFF', 0.30, 0.04, true);
        const puntRing = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.032, 16, 48), puntGlass);
        puntRing.rotation.x = Math.PI / 2;
        puntRing.position.y = -1.40;
        group.add(puntRing);
      }

      return group;
    }

    // Optional external .glb / .gltf 3D scan loader (drop a file in ./assets/models/<id>.glb and set modelGlb in catalog.json)
    function tryLoadExternalGlb(l, envTex, targetGroup, onLoaded) {
      if (!l.modelGlb) return;
      const addons = window.__THREE_ADDONS__;
      if (!addons || !addons.GLTFLoader) return;
      const loader = new addons.GLTFLoader();
      loader.load(l.modelGlb, gltf => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = 3.05 / maxDim;
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        model.traverse(node => {
          if (node.isMesh && node.material) {
            node.material.envMap = envTex;
            node.material.envMapIntensity = 1.5;
            node.material.needsUpdate = true;
          }
        });
        while (targetGroup.children.length) targetGroup.remove(targetGroup.children[0]);
        targetGroup.add(model);
        if (onLoaded) onLoaded();
      }, undefined, () => {
        // Fallback silently to procedural 3D bottle if .glb file is absent
      });
    }

    let threeCausticsEnabled = true;

    function makeCausticsPedestalMesh(l, isDark) {
      const col = new THREE.Color((l.bottle3d && l.bottle3d.liquidColor) || l.accent || '#D99B52');
      const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uRot: { value: 0 },
          uColor: { value: col },
          uDark: { value: isDark ? 1.0 : 0.0 },
          uShowCaustics: { value: threeCausticsEnabled ? 1.0 : 0.0 }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          precision mediump float;
          varying vec2 vUv;
          uniform float uTime;
          uniform float uRot;
          uniform vec3 uColor;
          uniform float uDark;
          uniform float uShowCaustics;

          void main() {
            vec2 p = (vUv - 0.5) * 2.0;
            float r = length(p);
            if (r > 1.0) discard;

            // Soft contact shadow directly under bottle base
            float shadow = smoothstep(0.68, 0.06, r) * mix(0.32, 0.55, uDark);

            // Animated optical refractive caustics ring projected around bottle base
            float angle = atan(p.y, p.x) + uRot * 1.15;
            float ring = exp(-pow((r - 0.46) * 4.2, 2.0));
            float c1 = sin(angle * 5.0 + uTime * 0.9 + sin(r * 10.0 - uTime * 0.6)) * 0.5 + 0.5;
            float c2 = cos(angle * 8.0 - uTime * 0.7 + cos(r * 12.0 + uTime * 0.5)) * 0.5 + 0.5;
            float caustic = pow(c1 * c2, 2.2) * ring * uShowCaustics;

            // Specular caustic core highlight
            vec3 causticTint = mix(uColor, vec3(1.0, 0.96, 0.88), 0.32);
            vec3 shadowCol = mix(vec3(0.10, 0.09, 0.08), vec3(0.02, 0.02, 0.02), uDark);

            vec3 finalCol = mix(shadowCol, causticTint, clamp(caustic * 2.2, 0.0, 1.0));
            float finalAlpha = clamp(shadow + caustic * mix(0.62, 0.92, uDark), 0.0, 0.92) * smoothstep(1.0, 0.65, r);
            gl_FragColor = vec4(finalCol, finalAlpha);
          }
        `
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = -1.48;
      return mesh;
    }

    function makeLiquidShaderMaterial(baseColor, accentColor) {
      return new THREE.ShaderMaterial({
        transparent: false,
        depthWrite: true,
        uniforms: {
          uTime: { value: 0 },
          uWobbleX: { value: 0 },
          uWobbleZ: { value: 0 },
          uDeepColor: { value: baseColor.clone().multiplyScalar(0.48) },
          uMidColor: { value: baseColor.clone() },
          uRimColor: { value: accentColor.clone().lerp(new THREE.Color(0xfff4dc), 0.38) },
          uLightDir: { value: new THREE.Vector3(0.55, 0.75, 0.65).normalize() }
        },
        vertexShader: `
          uniform float uTime;
          uniform float uWobbleX;
          uniform float uWobbleZ;
          varying vec3 vNormal;
          varying vec3 vViewPos;
          varying vec3 vLocalPos;
          void main() {
            vec3 pos = position;
            float topMask = smoothstep(0.12, 0.88, pos.y);
            float wave = (sin(pos.x * 8.0 + uTime * 2.5) * cos(pos.z * 8.0 - uTime * 2.1)) * 0.018;
            pos.y += (pos.x * uWobbleX + pos.z * uWobbleZ + wave) * topMask;
            vLocalPos = pos;
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            vViewPos = -mvPosition.xyz;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          precision mediump float;
          uniform vec3 uDeepColor;
          uniform vec3 uMidColor;
          uniform vec3 uRimColor;
          uniform vec3 uLightDir;
          varying vec3 vNormal;
          varying vec3 vViewPos;
          varying vec3 vLocalPos;
          void main() {
            vec3 N = normalize(vNormal);
            vec3 V = normalize(vViewPos);
            vec3 L = normalize(uLightDir);

            // Fresnel + Beer-Lambert backlit translucency (SSS)
            float ndotv = clamp(dot(N, V), 0.0, 1.0);
            float fresnel = pow(1.0 - ndotv, 2.35);
            float backLight = pow(clamp(dot(-L, V), 0.0, 1.0), 3.0) * 0.48;
            float diff = clamp(dot(N, L), 0.0, 1.0);

            // Vertical depth absorption (darker at base, brighter near top meniscus)
            float hGrad = clamp((vLocalPos.y + 1.35) / 2.2, 0.0, 1.0);
            vec3 col = mix(uDeepColor, uMidColor, 0.34 + hGrad * 0.66);
            col = mix(col, uRimColor, fresnel * 0.68 + backLight * 0.52);

            // Crisp specular liquid highlight + meniscus gleam
            vec3 H = normalize(L + V);
            float spec = pow(clamp(dot(N, H), 0.0, 1.0), 52.0);
            float meniscus = smoothstep(0.70, 0.86, vLocalPos.y) * 0.28;
            col += vec3(1.0, 0.97, 0.92) * (spec * 0.58 + meniscus + diff * 0.14);

            gl_FragColor = vec4(col, 1.0);
          }
        `
      });
    }

    function makeGlassFresnelShader(tintHex, isBarLight) {
      return new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uRimColor: { value: new THREE.Color(isBarLight ? '#FFD28A' : tintHex) },
          uIntensity: { value: isBarLight ? 0.34 : 0.20 }
        },
        vertexShader: `
          varying vec3 vN;
          varying vec3 vV;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vV = normalize(-mv.xyz);
            vN = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          precision mediump float;
          uniform vec3 uRimColor;
          uniform float uIntensity;
          varying vec3 vN;
          varying vec3 vV;
          void main() {
            float f = pow(1.0 - clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0), 3.2);
            gl_FragColor = vec4(uRimColor, f * uIntensity);
          }
        `
      });
    }

    // Real-time procedural GLSL Condensation & Trickling Droplets Shader
    function makeCondensationShader(isEnabled) {
      return new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uFrost: { value: isEnabled ? 1.0 : 0.0 },
          uLightDir: { value: new THREE.Vector3(0.55, 0.75, 0.65).normalize() }
        },
        vertexShader: `
          varying vec3 vLocal;
          varying vec3 vN;
          varying vec3 vV;
          void main() {
            vLocal = position;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vV = normalize(-mv.xyz);
            vN = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          precision mediump float;
          uniform float uTime;
          uniform float uFrost;
          uniform vec3 uLightDir;
          varying vec3 vLocal;
          varying vec3 vN;
          varying vec3 vV;

          float hash21(vec2 p) {
            p = fract(p * vec2(234.34, 435.345));
            p += dot(p, p + 34.23);
            return fract(p.x * p.y);
          }

          void main() {
            if (uFrost < 0.01) discard;
            vec3 N = normalize(vN);
            vec3 V = normalize(vV);
            vec3 L = normalize(uLightDir);

            // Cylindrical UV mapping around bottle surface
            float ang = atan(vLocal.z, vLocal.x) / 6.283185 + 0.5;
            vec2 uv = vec2(ang * 14.0, vLocal.y * 7.5);

            // Layer 1: Fine chilled micro-mist
            vec2 mGrid = fract(uv * 5.0) - 0.5;
            vec2 mId = floor(uv * 5.0);
            float mRnd = hash21(mId);
            float microDrop = smoothstep(0.32, 0.08, length(mGrid - (vec2(mRnd, fract(mRnd * 17.3)) - 0.5) * 0.45));

            // Layer 2: Slowly trickling larger condensation beads
            vec2 dropUv = uv * vec2(1.4, 0.75);
            vec2 dId = floor(dropUv);
            float colRnd = hash21(vec2(dId.x, 19.7));
            float trickleY = dropUv.y + uTime * (0.09 + colRnd * 0.08) + colRnd * 6.0;
            vec2 tId = vec2(dId.x, floor(trickleY));
            vec2 tF = vec2(fract(dropUv.x) - 0.5, fract(trickleY) - 0.5);
            float dropRnd = hash21(tId);
            float wobbleX = sin(trickleY * 2.5 + dropRnd * 6.28) * 0.14;
            vec2 dPos = vec2(tF.x - wobbleX, tF.y * 1.45);
            float mainDrop = smoothstep(0.24, 0.05, length(dPos)) * step(0.42, dropRnd);

            // Specular highlight on droplet dome + frosted rim
            float fresnel = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.4);
            float spec = pow(clamp(dot(N, normalize(L + V)), 0.0, 1.0), 32.0);
            float dropMask = clamp(microDrop * 0.28 + mainDrop * 0.85, 0.0, 1.0);
            float mistBase = 0.14 + fresnel * 0.24;

            vec3 col = mix(vec3(0.86, 0.93, 0.98), vec3(1.0), spec * 0.8 + mainDrop * 0.5);
            float alpha = (mistBase + dropMask * 0.52 + spec * mainDrop * 0.45) * uFrost;
            gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.78));
          }
        `
      });
    }

    let threeFrostEnabled = false;
    let threeLightMode = 'studio';

    function getThreeLightPreset(mode) {
      if (mode === 'bar') {
        return { amb: 0xffe4c4, ambI: 0.65, key: 0xffaa44, keyI: 2.6, fill: 0x4f7cff, fillI: 1.65, rim: 0xff6b35, rimI: 2.1, bloom: 0.40 };
      }
      if (mode === 'sunset') {
        return { amb: 0xffe8d6, ambI: 0.75, key: 0xff9e5e, keyI: 2.4, fill: 0xffd6a5, fillI: 1.3, rim: 0xffb703, rimI: 1.9, bloom: 0.30 };
      }
      return { amb: 0xffffff, ambI: 0.85, key: 0xfff6ea, keyI: 2.15, fill: 0xeef4ff, fillI: 1.15, rim: 0xffffff, rimI: 1.65, bloom: 0.20 };
    }

    function initThreeBottle(l) {
      const container = document.getElementById('threeContainer');
      const T = typeof THREE !== 'undefined' ? THREE : null;
      if (!container) return;
      if (!T) {
        pendingThreeLiqueur = l;
        return;
      }
      pendingThreeLiqueur = null;
      destroyThree();
      container.innerHTML = '';

      // Inject 3D FX quick toolbar (Caustics + Frost + Lighting presets) in parent wrapper
      const wrap = container.parentElement;
      const syncFxButtons = () => {
        if (!wrap) return;
        const fxBar = wrap.querySelector('#threeFxBar');
        if (!fxBar) return;
        const activeCls = 'bg-[#1A1816] text-white border-[#1A1816]';
        const idleCls = 'bg-white/90 border-[#D7CEC0] text-[#524C46]';
        const setBtnState = (el, active) => {
          if (!el) return;
          el.className = `px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${active ? activeCls : idleCls}`;
        };
        setBtnState(fxBar.querySelector('#threeCausticsBtn'), threeCausticsEnabled);
        setBtnState(fxBar.querySelector('#threeFrostBtn'), threeFrostEnabled);
        fxBar.querySelectorAll('[data-three-light]').forEach(b => {
          setBtnState(b, b.dataset.threeLight === threeLightMode);
        });
      };

      if (wrap) {
        let fxBar = wrap.querySelector('#threeFxBar');
        if (!fxBar) {
          fxBar = document.createElement('div');
          fxBar.id = 'threeFxBar';
          fxBar.className = 'flex flex-wrap items-center justify-center gap-1.5 mt-2';
          wrap.appendChild(fxBar);
        }
        fxBar.innerHTML = `
          <button type="button" id="threeCausticsBtn">✨ Каустика</button>
          <button type="button" id="threeFrostBtn">❄ Иней / капли</button>
          <button type="button" data-three-light="studio">Студия</button>
          <button type="button" data-three-light="bar">Неон-бар</button>
          <button type="button" data-three-light="sunset">Закат</button>`;
        syncFxButtons();

        const cBtn = fxBar.querySelector('#threeCausticsBtn');
        if (cBtn) cBtn.onclick = () => {
          threeCausticsEnabled = !threeCausticsEnabled;
          syncFxButtons();
          if (threeCtx && threeCtx.updateFX) threeCtx.updateFX();
        };
        const fBtn = fxBar.querySelector('#threeFrostBtn');
        if (fBtn) fBtn.onclick = () => {
          threeFrostEnabled = !threeFrostEnabled;
          syncFxButtons();
          if (threeCtx && threeCtx.updateFX) threeCtx.updateFX();
        };
        fxBar.querySelectorAll('[data-three-light]').forEach(b => {
          b.onclick = () => {
            threeLightMode = b.dataset.threeLight;
            syncFxButtons();
            if (threeCtx && threeCtx.updateFX) threeCtx.updateFX();
          };
        });
      }

      const w = container.clientWidth || 340;
      const h = container.clientHeight || 360;
      const scene = new THREE.Scene();
      const getSceneBgHex = (darkFlag, mode) => darkFlag ? 0x181512 : (mode === 'sunset' ? 0xf6ebe0 : 0xf4eee4);
      scene.background = new THREE.Color(getSceneBgHex(document.documentElement.classList.contains('speakeasy-mode') || threeLightMode === 'bar', threeLightMode));
      const camera = new THREE.PerspectiveCamera(32, w / h, 0.1, 100);
      camera.position.set(0, 0.22, 6.1);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);

      const envRT = createStudioEnv(renderer);
      scene.environment = envRT.texture;

      // Dynamic 3-point studio / bar / sunset lighting (updated live without recreating WebGL)
      const lightCfg = getThreeLightPreset(threeLightMode);
      const ambLight = new THREE.AmbientLight(lightCfg.amb, lightCfg.ambI);
      scene.add(ambLight);
      const keyLight = new THREE.DirectionalLight(lightCfg.key, lightCfg.keyI);
      keyLight.position.set(4.5, 6.5, 5.5);
      scene.add(keyLight);
      const fillLight = new THREE.DirectionalLight(lightCfg.fill, lightCfg.fillI);
      fillLight.position.set(-5, 2.5, 3);
      scene.add(fillLight);
      const backRim = new THREE.DirectionalLight(lightCfg.rim, lightCfg.rimI);
      backRim.position.set(0, 4, -6);
      scene.add(backRim);

      const bottleGroup = buildBottleMeshGroup(l, envRT.texture);

      // Classify meshes, upgrade liquids to GLSL Beer-Lambert shader, and assign explicit renderOrder
      const liquidMeshes = [];
      const liquidShaderMats = [];
      const glassMeshes = [];
      const accentCol = new THREE.Color(l.accent || '#D99B52');
      bottleGroup.traverse(obj => {
        if (!obj.isMesh || !obj.material) return;
        const mat = obj.material;
        if (mat.userData && mat.userData.isLiquid) {
          const liqShader = makeLiquidShaderMaterial(mat.color, accentCol);
          mat.dispose();
          obj.material = liqShader;
          obj.renderOrder = 1;
          liquidMeshes.push(obj);
          liquidShaderMats.push(liqShader);
        } else if (mat.userData && mat.userData.isGlass) {
          obj.renderOrder = 2;
          if (threeFrostEnabled) {
            mat.roughness = Math.min(0.28, (mat.userData.baseRoughness || 0.05) + 0.14);
            mat.clearcoatRoughness = 0.22;
          }
          glassMeshes.push(obj);
        } else {
          obj.renderOrder = 3;
        }
      });

      // Add optical Fresnel glass rim shell & animated GLSL condensation shell across ALL glass meshes
      const isDarkInit = document.documentElement.classList.contains('speakeasy-mode') || threeLightMode === 'bar';
      const fresnelMat = makeGlassFresnelShader('#FFF5E4', isDarkInit);
      const condensationMat = makeCondensationShader(threeFrostEnabled);
      const frostShells = [];
      glassMeshes.forEach(gMesh => {
        const rimShell = new THREE.Mesh(gMesh.geometry, fresnelMat);
        rimShell.position.copy(gMesh.position);
        rimShell.rotation.copy(gMesh.rotation);
        rimShell.scale.copy(gMesh.scale).multiplyScalar(1.005);
        rimShell.renderOrder = 4;
        bottleGroup.add(rimShell);

        const frostShell = new THREE.Mesh(gMesh.geometry, condensationMat);
        frostShell.position.copy(gMesh.position);
        frostShell.rotation.copy(gMesh.rotation);
        frostShell.scale.copy(gMesh.scale).multiplyScalar(1.009);
        frostShell.renderOrder = 5;
        frostShell.visible = threeFrostEnabled;
        bottleGroup.add(frostShell);
        frostShells.push(frostShell);
      });
      scene.add(bottleGroup);
      tryLoadExternalGlb(l, envRT.texture, bottleGroup);

      // Postprocessing: EffectComposer + UnrealBloomPass + OutputPass (when r164 addons are loaded)
      let composer = null;
      let bloomPass = null;
      const addons = window.__THREE_ADDONS__;
      if (addons && addons.EffectComposer && addons.RenderPass && addons.UnrealBloomPass) {
        try {
          composer = new addons.EffectComposer(renderer);
          composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
          composer.setSize(w, h);
          const renderPass = new addons.RenderPass(scene, camera);
          renderPass.clearAlpha = 0;
          composer.addPass(renderPass);
          bloomPass = new addons.UnrealBloomPass(new THREE.Vector2(w, h), lightCfg.bloom, 0.45, 0.86);
          composer.addPass(bloomPass);
          if (addons.OutputPass) {
            composer.addPass(new addons.OutputPass());
          }
        } catch (e) {
          composer = null;
          bloomPass = null;
        }
      }

      // Real-time GLSL refractive caustics & contact shadow pedestal
      const causticsDisc = makeCausticsPedestalMesh(l, isDarkInit);
      causticsDisc.renderOrder = 0;
      scene.add(causticsDisc);

      // Live uniform & material updater (zero WebGL recreation!)
      const updateFX = () => {
        const isDarkNow = document.documentElement.classList.contains('speakeasy-mode') || threeLightMode === 'bar';
        if (scene.background && scene.background.setHex) {
          scene.background.setHex(getSceneBgHex(isDarkNow, threeLightMode));
        }
        const cfg = getThreeLightPreset(threeLightMode);
        ambLight.color.setHex(cfg.amb); ambLight.intensity = cfg.ambI;
        keyLight.color.setHex(cfg.key); keyLight.intensity = cfg.keyI;
        fillLight.color.setHex(cfg.fill); fillLight.intensity = cfg.fillI;
        backRim.color.setHex(cfg.rim); backRim.intensity = cfg.rimI;

        if (bloomPass) {
          bloomPass.strength = isDarkNow ? Math.max(cfg.bloom, 0.36) : cfg.bloom;
        }
        if (causticsDisc && causticsDisc.material && causticsDisc.material.uniforms) {
          causticsDisc.material.uniforms.uShowCaustics.value = threeCausticsEnabled ? 1.0 : 0.0;
          causticsDisc.material.uniforms.uDark.value = isDarkNow ? 1.0 : 0.0;
        }
        fresnelMat.uniforms.uRimColor.value.set(isDarkNow ? '#FFD28A' : '#FFF5E4');
        fresnelMat.uniforms.uIntensity.value = isDarkNow ? 0.34 : 0.20;

        condensationMat.uniforms.uFrost.value = threeFrostEnabled ? 1.0 : 0.0;
        frostShells.forEach(s => { s.visible = threeFrostEnabled; });
        glassMeshes.forEach(gm => {
          const baseR = gm.material.userData.baseRoughness || 0.05;
          gm.material.roughness = threeFrostEnabled ? Math.min(0.28, baseR + 0.14) : baseR;
          gm.material.clearcoatRoughness = threeFrostEnabled ? 0.22 : 0.03;
        });
      };

      let isDragging = false;
      let prevX = 0, prevY = 0;
      let targetRotY = 0.22, targetRotX = 0.05;
      let targetZoom = 6.1;
      let autoSpin = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let pinchStartDist = 0;
      let pinchStartZoom = 6.1;

      const onPointerDown = e => {
        if (e.pointerType === 'touch' && !e.isPrimary) return;
        isDragging = true;
        autoSpin = false;
        prevX = e.clientX;
        prevY = e.clientY;
        syncSpinBtn();
      };
      const onPointerMove = e => {
        if (!isDragging) return;
        targetRotY += (e.clientX - prevX) * 0.013;
        targetRotX = Math.max(-0.45, Math.min(0.45, targetRotX + (e.clientY - prevY) * 0.008));
        prevX = e.clientX;
        prevY = e.clientY;
      };
      const onPointerUp = () => { isDragging = false; };
      const onWheel = e => {
        e.preventDefault();
        targetZoom = Math.max(3.8, Math.min(8.2, targetZoom + e.deltaY * 0.004));
      };
      const onTouchStart = e => {
        if (e.touches.length === 2) {
          isDragging = false;
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          pinchStartDist = Math.hypot(dx, dy);
          pinchStartZoom = targetZoom;
        }
      };
      const onTouchMove = e => {
        if (e.touches.length === 2 && pinchStartDist > 0) {
          e.preventDefault();
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const scale = pinchStartDist / Math.max(10, Math.hypot(dx, dy));
          targetZoom = Math.max(3.8, Math.min(8.2, pinchStartZoom * scale));
        }
      };
      const onResize = () => {
        if (!container) return;
        const nw = container.clientWidth || 340;
        const nh = container.clientHeight || 360;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
        if (composer) composer.setSize(nw, nh);
      };

      const dom = renderer.domElement;
      dom.addEventListener('pointerdown', onPointerDown);
      dom.addEventListener('wheel', onWheel, { passive: false });
      dom.addEventListener('touchstart', onTouchStart, { passive: true });
      dom.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('resize', onResize);

      const zoomInBtn = document.getElementById('threeZoomIn');
      const zoomOutBtn = document.getElementById('threeZoomOut');
      const spinBtn = document.getElementById('threeAutoSpin');
      const resetBtn = document.getElementById('threeReset');

      function syncSpinBtn() {
        if (!spinBtn) return;
        spinBtn.classList.toggle('bg-[#1A1816]', autoSpin);
        spinBtn.classList.toggle('text-white', autoSpin);
        spinBtn.classList.toggle('bg-white/90', !autoSpin);
      }
      syncSpinBtn();

      if (zoomInBtn) zoomInBtn.onclick = () => { targetZoom = Math.max(3.8, targetZoom - 0.6); };
      if (zoomOutBtn) zoomOutBtn.onclick = () => { targetZoom = Math.min(8.2, targetZoom + 0.6); };
      if (spinBtn) spinBtn.onclick = () => { autoSpin = !autoSpin; syncSpinBtn(); };
      if (resetBtn) resetBtn.onclick = () => { targetRotY = 0.22; targetRotX = 0.05; targetZoom = 6.1; autoSpin = true; syncSpinBtn(); };

      // Pause 3D rendering automatically when scrolled out of view or tab is hidden (saves iPhone battery)
      let isInViewport = true;
      let io = null;
      if (typeof IntersectionObserver !== 'undefined') {
        io = new IntersectionObserver(entries => {
          isInViewport = entries[0] ? entries[0].isIntersecting : true;
        }, { threshold: 0.05 });
        io.observe(container);
      }

      const cleanup = () => {
        dom.removeEventListener('pointerdown', onPointerDown);
        dom.removeEventListener('wheel', onWheel);
        dom.removeEventListener('touchstart', onTouchStart);
        dom.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('resize', onResize);
      };

      threeCtx = { renderer, composer, scene, envRT, raf: 0, cleanup, io, updateFX };

      let prevRotY = targetRotY;
      let wobbleVel = 0;
      let wobbleAngle = 0;
      function animate() {
        if (!threeCtx) return;
        threeCtx.raf = requestAnimationFrame(animate);
        if (document.hidden || !isInViewport) return;

        if (autoSpin) targetRotY += 0.007;
        const dy = (targetRotY - bottleGroup.rotation.y) * 0.1;
        bottleGroup.rotation.y += dy;
        bottleGroup.rotation.x += (targetRotX - bottleGroup.rotation.x) * 0.1;
        camera.position.z += (targetZoom - camera.position.z) * 0.12;

        // Spring-damped liquid slosh physics when spinning bottle
        const angularAccel = (bottleGroup.rotation.y - prevRotY);
        prevRotY = bottleGroup.rotation.y;
        wobbleVel += (-angularAccel * 1.45 - wobbleAngle * 0.14);
        wobbleVel *= 0.86;
        wobbleAngle = Math.max(-0.14, Math.min(0.14, wobbleAngle + wobbleVel));
        const tSec = performance.now() * 0.001;
        for (let i = 0; i < liquidMeshes.length; i++) {
          liquidMeshes[i].rotation.z = wobbleAngle * 0.55;
        }
        for (let i = 0; i < liquidShaderMats.length; i++) {
          liquidShaderMats[i].uniforms.uTime.value = tSec;
          liquidShaderMats[i].uniforms.uWobbleX.value = wobbleAngle * 1.9;
          liquidShaderMats[i].uniforms.uWobbleZ.value = bottleGroup.rotation.x * 0.48;
        }
        if (threeFrostEnabled) {
          condensationMat.uniforms.uTime.value = tSec;
        }
        if (causticsDisc && causticsDisc.material && causticsDisc.material.uniforms) {
          causticsDisc.material.uniforms.uTime.value = tSec;
          causticsDisc.material.uniforms.uRot.value = bottleGroup.rotation.y;
        }

        if (composer) {
          composer.render();
        } else {
          renderer.render(scene, camera);
        }
      }
      animate();
    }


    