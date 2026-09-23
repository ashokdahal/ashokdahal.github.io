(() => {
  if (!window.L) return;

  const views = {
    world:       { center:[36.5,48.0], zoom:3.15, duration:1.5 },
    nepal:       { center:[28.25,84.15], zoom:6.15, duration:1.4 },
    netherlands: { center:[52.18,5.55], zoom:7.15, duration:1.5 },
    utwide:      { center:[52.22,6.55], zoom:9.2, duration:1.35 },
    ut:          { center:[52.238,6.856], zoom:12.4, duration:1.25 },
    campus:      { center:[52.239,6.856], zoom:14.55, duration:1.2 },
    campusclose: { center:[52.239,6.856], zoom:15.4, duration:1.1 },
    worldfinal:  { center:[36.8,48.0], zoom:3.05, duration:1.6 }
  };

  const map = L.map('map', {
    zoomControl:true,
    scrollWheelZoom:false,
    doubleClickZoom:true,
    boxZoom:false,
    keyboard:true,
    worldCopyJump:true,
    attributionControl:true
  }).setView(views.world.center, views.world.zoom);

  L.tileLayer('https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=cb1_3v84_1_481d62720dff5cdc8eac2002', {
    subdomains:'sabcd',
    maxZoom:20,
    attribution:'&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(map);

  const routePane = map.createPane('routePane');
  routePane.style.zIndex = 420;
  const practicePane = map.createPane('practicePane');
  practicePane.style.zIndex = 460;

  const nepalIcon = L.divIcon({ className:'origin-icon', html:'<div class="origin-dot">NP</div>', iconSize:[44,44], iconAnchor:[22,22] });
  const utIcon = L.divIcon({ className:'ut-icon', html:'<div class="ut-dot">UT</div>', iconSize:[44,44], iconAnchor:[22,22] });

  const nepalMarker = L.marker([28.2,84.0], {icon:nepalIcon, pane:'practicePane'}).addTo(map).bindTooltip('My experience of structured learning', {direction:'top', offset:[0,-18], className:'story-tooltip'});
  const utMarker = L.marker([52.239,6.856], {icon:utIcon, pane:'practicePane'}).addTo(map).bindTooltip('University of Twente · my teaching context', {direction:'top', offset:[0,-18], className:'story-tooltip'});

  const journeyCoords = [
    [28.2,84.0],[29.8,76.0],[31.0,67.0],[33.2,58.0],[36.0,48.0],[39.5,38.0],[43.5,28.0],[47.0,18.0],[50.0,10.0],[52.239,6.856]
  ];
  const routeShadow = L.polyline(journeyCoords,{pane:'routePane',color:'#ffffff',weight:7,opacity:.72,lineCap:'round'}).addTo(map);
  const route = L.polyline(journeyCoords,{pane:'routePane',color:'#496953',weight:3.2,opacity:.95,dashArray:'8 9',lineCap:'round'}).addTo(map);

  const practiceData = {
    design:{
      label:'Design',
      title:'Start from what students must eventually be able to do',
      body:'I sequence activities from understanding a method to applying and comparing it. In GeoAI, students can move from learning the logic of a machine-learning workflow to training RF and SVM models, evaluating ROC–AUC, mapping predictions and interpreting why the outputs differ.',
      advantage:'Activities rehearse the reasoning required in assessment and professional practice.',
      risk:'Authentic tasks can become too complex too early.',
      response:'Stage the workflow and offer extension work for students who are already experienced.'
    },
    teaching:{
      label:'Teaching',
      title:'Use explanation to prepare students for active work',
      body:'I use concise explanation and worked examples when concepts are new, then move towards guided coding, comparison, discussion and independent problem solving. My role changes within the same session rather than remaining fixed.',
      advantage:'Students receive enough conceptual structure to participate meaningfully in active learning.',
      risk:'One pace can still be too slow for some students and too fast for others.',
      response:'Use checkpoints, optional support and extension tasks instead of assuming one entry level.'
    },
    supervision:{
      label:'Supervision',
      title:'Reduce guidance as academic judgement develops',
      body:'At the beginning of a project I help students define a feasible question, identify evidence and structure the work. As their understanding develops, I shift from giving directions to asking questions that require them to justify choices and propose the next step.',
      advantage:'Students learn to make research decisions rather than only execute instructions.',
      risk:'Too much guidance creates dependence; too little can cause avoidable delay.',
      response:'Agree on milestones and explicitly change the level of supervision as competence grows.'
    },
    assessment:{
      label:'Assessment',
      title:'Assess application and judgement, not recall alone',
      body:'I want assessment to show whether students can apply a method, interpret outputs, explain limitations and justify choices. Knowledge remains important, but it should support rather than replace evidence of higher-level performance.',
      advantage:'Assessment communicates that reasoning and application are central learning goals.',
      risk:'Open tasks can make expectations less transparent.',
      response:'Use explicit criteria, examples and alignment between outcomes, activities and assessment.'
    },
    evaluation:{
      label:'Evaluation',
      title:'Evaluate early enough to change the teaching',
      body:'At the start of the course I want to examine students’ prior programming, mathematics, geospatial and machine-learning experience and adapt pacing and support accordingly. Later evaluation checks whether those choices were appropriate.',
      advantage:'Evaluation informs teaching while there is still time to adapt it.',
      risk:'Self-reported confidence does not always equal actual competence.',
      response:'Combine self-report with short diagnostic tasks and observations during early exercises.'
    }
  };

  const practiceCoords = {
    design:[52.2418,6.8478], teaching:[52.2433,6.8573], supervision:[52.2382,6.8664], assessment:[52.2337,6.8595], evaluation:[52.2349,6.8486]
  };
  const practiceMarkers = {};
  Object.entries(practiceCoords).forEach(([key,coords]) => {
    const icon = L.divIcon({
      className:'practice-icon',
      html:`<div class="practice-pin" data-pin="${key}"><i></i>${practiceData[key].label}</div>`,
      iconSize:[110,30],iconAnchor:[10,15]
    });
    practiceMarkers[key] = L.marker(coords,{icon,pane:'practicePane',interactive:true}).on('click',()=>activatePractice(key));
  });

  const learningPath = L.polyline(Object.values(practiceCoords),{pane:'routePane',color:'#79704d',weight:2,opacity:.7,dashArray:'4 8'});
  const practiceGroup = L.layerGroup([...Object.values(practiceMarkers), learningPath]);

  const detail = document.getElementById('practiceDetail');
  const practiceButtons = [...document.querySelectorAll('.practice-button')];
  function activatePractice(key){
    const d = practiceData[key];
    if(!d) return;
    practiceButtons.forEach(b=>b.classList.toggle('is-active',b.dataset.practice===key));
    Object.keys(practiceMarkers).forEach(k=>{
      const el = practiceMarkers[k].getElement()?.querySelector('.practice-pin');
      if(el) el.classList.toggle('active',k===key);
    });
    detail.innerHTML = `
      <div class="practice-copy"><p class="kicker">${d.label}</p><h3>${d.title}</h3><p>${d.body}</p></div>
      <div class="decision-stack"><dl><dt>Advantage</dt><dd>${d.advantage}</dd><dt>Risk</dt><dd>${d.risk}</dd><dt>My response</dt><dd>${d.response}</dd></dl></div>`;
  }
  practiceButtons.forEach(b=>b.addEventListener('click',()=>activatePractice(b.dataset.practice)));
  activatePractice('design');

  const theoryButtons = [...document.querySelectorAll('.layer-item')];
  theoryButtons.forEach(btn=>btn.addEventListener('click',()=>{
    theoryButtons.forEach(b=>b.classList.toggle('is-open',b===btn));
  }));

  const refDialog = document.getElementById('referencesDialog');
  document.getElementById('referencesButton')?.addEventListener('click',()=>refDialog.showModal());

  const steps = [...document.querySelectorAll('.story-step')];
  let activeStep = 0;

  function setPracticeVisible(visible){
    if(visible){
      if(!map.hasLayer(practiceGroup)) practiceGroup.addTo(map);
    }else if(map.hasLayer(practiceGroup)){
      map.removeLayer(practiceGroup);
    }
  }

  function styleForStep(step){
    const n = Number(step.dataset.step);
    route.setStyle({opacity:(n===0||n===2||n===7)?1:.34,weight:(n===0||n===7)?3.5:2.5});
    routeShadow.setStyle({opacity:(n===0||n===7)?.82:.28,weight:(n===0||n===7)?8:6});
    nepalMarker.setOpacity(n===1||n===0||n===7?1:.42);
    utMarker.setOpacity(n>=2?1:.42);
    setPracticeVisible(n===5);
  }

  function goToStep(step, immediate=false){
    const key = step.dataset.view;
    const v = views[key];
    if(!v) return;
    activeStep = Number(step.dataset.step);
    document.body.dataset.chapter = String(activeStep);
    document.getElementById('currentChapter').textContent = String(activeStep+1).padStart(2,'0');
    steps.forEach(s=>s.classList.toggle('is-active',s===step));
    styleForStep(step);
    if(immediate){map.setView(v.center,v.zoom,{animate:false});}
    else{map.flyTo(v.center,v.zoom,{duration:v.duration,easeLinearity:.22});}
  }

  const observer = new IntersectionObserver(entries=>{
    const visible = entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if(visible) goToStep(visible.target);
  },{root:null,threshold:[.25,.45,.62],rootMargin:'-20% 0px -20% 0px'});
  steps.forEach(step=>observer.observe(step));

  document.getElementById('mapReset')?.addEventListener('click',()=>goToStep(steps[activeStep]));

  map.on('zoomend moveend',()=>{
    // Keep conceptual teaching labels readable when the user explores the map manually.
    if(activeStep===5){
      Object.values(practiceMarkers).forEach(m=>m.setOpacity(map.getZoom()>=13?1:.5));
    }
  });

  goToStep(steps[0],true);
})();
