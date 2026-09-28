(() => {
  const partSections = [...document.querySelectorAll('.extension-part')];
  const partLinks = [...document.querySelectorAll('[data-nav-part]')];

  const atlasTopics = {
    b: [
      'Teaching roles',
      'Course teamwork',
      'Colleague feedback',
      'University decisions'
    ],
    c: [
      'Course design',
      'Teaching practice',
      'Student supervision',
      'Assessment',
      'Evaluation',
      'Educational vision',
      '2026–27 plan',
      'Next course cycle'
    ]
  };

  function buildTopicAtlas(part){
    const section = document.getElementById(`part-${part}`);
    const content = section?.querySelector('.part-content');
    const sources = content ? [...content.children].filter(child =>
      child.matches('.reading-section, .action-plan, .final-reflection')
    ) : [];
    const titles = atlasTopics[part];
    if(!content || sources.length!==titles.length) return;

    const atlas = document.createElement('div');
    atlas.className = `topic-atlas topic-atlas-${part}`;
    atlas.id = part==='b' ? 'part-b-team' : 'part-c-learning';
    atlas.dataset.mapFocus = part==='b' ? 'campusclose' : 'campus';

    const diagram = document.createElement('div');
    diagram.className = 'atlas-diagram';
    diagram.setAttribute('aria-label', part==='b' ? 'Teaching-team branches converging at the University of Twente' : 'Circular teaching reflection and improvement plan');

    const connectors = document.createElementNS('http://www.w3.org/2000/svg','svg');
    connectors.classList.add('atlas-connectors');
    connectors.setAttribute('viewBox','0 0 100 100');
    connectors.setAttribute('preserveAspectRatio','none');
    connectors.setAttribute('aria-hidden','true');
    connectors.innerHTML = part==='b'
      ? '<path d="M15 18 L50 50 M85 18 L50 50 M15 82 L50 50 M85 82 L50 50 M50 50 L92 50" />'
      : '<circle cx="50" cy="50" r="39" /><path d="M50 11 L50 50 M78 22 L50 50 M89 50 L50 50 M78 78 L50 50 M50 89 L50 50 M22 78 L50 50 M11 50 L50 50 M22 22 L50 50" />';
    diagram.append(connectors);

    const hub = document.createElement('div');
    hub.className = 'atlas-hub';
    hub.innerHTML = '<span>UT</span><small>University of Twente</small>';
    diagram.append(hub);

    const tabs = document.createElement('div');
    tabs.className = 'atlas-nodes';
    tabs.setAttribute('role','tablist');
    tabs.setAttribute('aria-label',part==='b' ? 'Working together as a team topics' : 'Reflection on my development and future plan');

    const details = document.createElement('div');
    details.className = 'atlas-details';

    sources.forEach((source,index)=>{
      const button = document.createElement('button');
      button.className = 'atlas-node';
      button.type = 'button';
      button.id = `part-${part}-tab-${index+1}`;
      button.setAttribute('role','tab');
      button.setAttribute('aria-controls',`part-${part}-panel-${index+1}`);
      button.setAttribute('aria-selected',index===0 ? 'true' : 'false');
      button.tabIndex = index===0 ? 0 : -1;
      button.innerHTML = `<span class="atlas-node-number">${String(index+1).padStart(2,'0')}</span><span class="atlas-node-title"></span>`;
      button.querySelector('.atlas-node-title').textContent = titles[index];
      tabs.append(button);

      const panel = document.createElement('article');
      panel.className = 'atlas-detail';
      panel.id = `part-${part}-panel-${index+1}`;
      panel.setAttribute('role','tabpanel');
      panel.setAttribute('aria-labelledby',button.id);
      panel.dataset.topicIndex = String(index);

      if(source.matches('.reading-section')){
        const copy = source.querySelector('.reading-copy');
        const quote = source.querySelector('.feedback-pullquote');
        if(copy) panel.append(copy);
        if(quote) panel.append(quote);
      }else if(source.matches('.action-plan')){
        source.querySelectorAll('h2,.action-grid').forEach(element=>panel.append(element));
      }else{
        [...source.children].filter(element=>!element.matches('.section-index')).forEach(element=>panel.append(element));
      }
      details.append(panel);
      source.remove();
    });

    if(part==='b'){
      const closing = [...content.children].find(child=>child.matches('.part-closing')&&!child.matches('.final-reflection'));
      const feedbackPanel = details.querySelector('#part-b-panel-3');
      const closingCopy = closing?.querySelector(':scope > p:not(.section-index)');
      const nextPartLink = closing?.querySelector('.part-jump');
      if(closing&&feedbackPanel&&closingCopy&&nextPartLink){
        const highlight = document.createElement('aside');
        highlight.className = 'atlas-highlight';
        const label = document.createElement('span');
        label.textContent = 'My next step';
        highlight.append(label,closingCopy,nextPartLink);
        feedbackPanel.append(highlight);
        closing.remove();
      }
    }

    function activateTab(index,moveFocus=false,scrollToPanel=false){
      const buttons = [...tabs.querySelectorAll('[role="tab"]')];
      const panels = [...details.querySelectorAll('[role="tabpanel"]')];
      buttons.forEach((button,buttonIndex)=>{
        const active = buttonIndex===index;
        button.setAttribute('aria-selected',String(active));
        button.tabIndex = active ? 0 : -1;
      });
      if(moveFocus) buttons[index].focus();
      if(scrollToPanel) panels[index].scrollIntoView({behavior:'smooth',block:'center'});
    }

    tabs.addEventListener('click',event=>{
      const button = event.target.closest('[role="tab"]');
      if(button) activateTab([...tabs.children].indexOf(button),false,true);
    });
    tabs.addEventListener('keydown',event=>{
      const buttons = [...tabs.querySelectorAll('[role="tab"]')];
      const currentIndex = buttons.indexOf(document.activeElement);
      let nextIndex = currentIndex;
      if(event.key==='ArrowRight'||event.key==='ArrowDown') nextIndex = (currentIndex+1)%buttons.length;
      else if(event.key==='ArrowLeft'||event.key==='ArrowUp') nextIndex = (currentIndex-1+buttons.length)%buttons.length;
      else if(event.key==='Home') nextIndex = 0;
      else if(event.key==='End') nextIndex = buttons.length-1;
      else return;
      event.preventDefault();
      activateTab(nextIndex,true,true);
    });

    let topicScrollPending = false;
    function updateActiveTopic(){
      const panels = [...details.querySelectorAll('[role="tabpanel"]')];
      const focusLine = window.innerHeight * .45;
      const activeIndex = panels.findIndex(panel=>{
        const bounds = panel.getBoundingClientRect();
        return bounds.top<=focusLine && bounds.bottom>=focusLine;
      });
      if(activeIndex>=0) activateTab(activeIndex);
    }
    window.addEventListener('scroll',()=>{
      if(topicScrollPending) return;
      topicScrollPending = true;
      requestAnimationFrame(()=>{
        topicScrollPending = false;
        updateActiveTopic();
      });
    },{passive:true});
    const topicObserver = new IntersectionObserver(updateActiveTopic,{threshold:[0,.15,.4]});
    [...details.querySelectorAll('[role="tabpanel"]')].forEach(panel=>topicObserver.observe(panel));

    diagram.append(tabs);
    atlas.append(diagram,details);
    content.prepend(atlas);
  }

  buildTopicAtlas('b');
  buildTopicAtlas('c');

  function updatePartNavigation(){
    const focusY = window.scrollY + window.innerHeight * .35;
    let currentPart = 'a';
    partSections.forEach(section=>{
      if(section.getBoundingClientRect().top + window.scrollY <= focusY) currentPart = section.dataset.part;
    });
    document.body.dataset.readingPart = currentPart;
    partLinks.forEach(link=>{
      if(link.dataset.navPart===currentPart) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
  }

  window.addEventListener('scroll',updatePartNavigation,{passive:true});
  const partObserver = new IntersectionObserver(updatePartNavigation,{threshold:0});
  partSections.forEach(section=>partObserver.observe(section));
  updatePartNavigation();

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

  const mapFocusSections = [...document.querySelectorAll('[data-map-focus]')];
  const worldFinale = document.getElementById('world-finale');
  let activeMapContext = null;

  function updateMapContext(){
    const finaleBounds = worldFinale.getBoundingClientRect();
    if(finaleBounds.top < window.innerHeight * .7 && finaleBounds.bottom > window.innerHeight * .3){
      if(activeMapContext!=='world'){
        activeMapContext = 'world';
        document.body.dataset.mapContext = 'world';
        setPracticeVisible(false);
        route?.setStyle({opacity:1,weight:3.5});
        routeShadow?.setStyle({opacity:.82,weight:8});
        nepalMarker?.setOpacity(1);
        utMarker?.setOpacity(1);
        map.flyTo(views.worldfinal.center,views.worldfinal.zoom,{duration:1.4,easeLinearity:.22});
      }
      return;
    }

    const focusLine = window.innerHeight * .54;
    const focusedSection = mapFocusSections.find(section=>{
      const bounds = section.getBoundingClientRect();
      return bounds.top <= focusLine && bounds.bottom >= focusLine;
    });

    if(!focusedSection){
      if(activeMapContext){
        activeMapContext = null;
        delete document.body.dataset.mapContext;
      }
      return;
    }

    const context = focusedSection.dataset.mapFocus;
    if(activeMapContext===context) return;
    activeMapContext = context;
    document.body.dataset.mapContext = context;
    route.setStyle({opacity:.28,weight:2.5});
    routeShadow.setStyle({opacity:.2,weight:6});
    nepalMarker.setOpacity(.35);
    utMarker.setOpacity(1);
    setPracticeVisible(false);
    const view = views[context];
    if(view) map.flyTo(view.center,view.zoom,{duration:view.duration,easeLinearity:.22});
  }

  window.addEventListener('scroll',updateMapContext,{passive:true});
  const mapContextObserver = new IntersectionObserver(updateMapContext,{threshold:[0,.25,.5]});
  mapFocusSections.forEach(section=>mapContextObserver.observe(section));
  mapContextObserver.observe(worldFinale);

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
  const route = L.polyline(journeyCoords,{pane:'routePane',color:'#05928d',weight:3.2,opacity:.95,dashArray:'8 9',lineCap:'round'}).addTo(map);

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

  const learningPath = L.polyline(Object.values(practiceCoords),{pane:'routePane',color:'#21488d',weight:2,opacity:.7,dashArray:'4 8'});
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
    setPracticeVisible(n===5 && document.body.dataset.readingPart==='a' && !document.body.dataset.mapContext);
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
