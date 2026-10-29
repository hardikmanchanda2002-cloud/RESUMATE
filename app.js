const $ = (id) => document.getElementById(id);
const fileInput = $("resumeFile"), resumeText = $("resumeText"), jobText = $("jobText");
if (window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0]; if (!file) return;
  $("fileStatus").textContent = `Reading ${file.name}…`;
  try {
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      if (!window.pdfjsLib) throw new Error("PDF reader could not load. Please paste your resume text instead.");
      const bytes = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({data: bytes}).promise;
      let all = "";
      for (let n=1; n<=pdf.numPages; n++) {
        const page = await pdf.getPage(n); const content = await page.getTextContent();
        all += content.items.map(x=>x.str).join(" ") + "\n";
      }
      resumeText.value = all;
    } else {
      resumeText.value = await file.text();
    }
    $("fileStatus").textContent = `✓ Loaded ${file.name}`;
  } catch (e) { $("fileStatus").textContent = e.message || "Could not read file."; }
});

const STOP = new Set(("a an the and or but for with from into to of in on at by as is are be this that will can should must have has had your you our their they it we role job work experience years year skills skill ability abilities knowledge strong good excellent preferred required requirements responsibilities qualifications using use build built develop developed development team communication including such").split(/\s+/));
function tokens(text) {
  return [...new Set((text.toLowerCase().match(/[a-z][a-z+#.]{1,}/g)||[]).filter(w=>!STOP.has(w) && w.length>2))];
}
const knownSkills = ["javascript","typescript","python","java","c++","html","css","react","node.js","express","mongodb","sql","postgresql","mysql","api","rest","git","github","docker","aws","azure","vercel","machine learning","deep learning","natural language processing","nlp","data analysis","excel","power bi","tableau","communication","leadership","project management","agile","figma","ui/ux","problem solving","linux","testing","debugging","algorithms","data structures","cloud","cybersecurity","prompt engineering","generative ai","gemini","openai","pandas","numpy","scikit-learn","tensorflow","pytorch","flask","django","fastapi","bootstrap","tailwind","next.js","vite","firebase","redis","graphql","kubernetes","ci/cd"];
function findSkills(text) {
 const lower=text.toLowerCase();
 return knownSkills.filter(s=>lower.includes(s));
}
function escapeHTML(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function chipList(items, gap=false) {return items.length ? `<div class="chips">${items.map(x=>`<span class="chip ${gap?'gap':''}">${escapeHTML(x)}</span>`).join("")}</div>` : `<p class="muted small">No clear items found from the supplied text.</p>`;}
function analyzeLocal(resume, job) {
 const rSkills=findSkills(resume), jSkills=findSkills(job);
 const rTokens=tokens(resume), jTokens=tokens(job);
 const skillMatches=jSkills.filter(s=>rSkills.includes(s));
 const missing=jSkills.filter(s=>!rSkills.includes(s));
 const overlapTokens=jTokens.filter(t=>rTokens.includes(t));
 const denominator=Math.max(1, new Set([...jSkills,...jTokens.slice(0,25)]).size);
 const numerator=skillMatches.length + Math.min(overlapTokens.length,25)*0.25;
 const score=Math.min(98,Math.round(100*numerator/denominator));
 const tips=[];
 if(missing.length) tips.push(`If you genuinely have experience with ${missing.slice(0,4).join(", ")}, make that experience more visible. Otherwise, consider learning these skills.`);
 if(!resume.toLowerCase().includes("project")) tips.push("Consider adding relevant academic or personal projects that demonstrate your skills.");
 if(!resume.toLowerCase().includes("achievement") && !resume.toLowerCase().includes("result")) tips.push("Where accurate, describe outcomes with concrete evidence such as time saved, scale, or measurable results.");
 tips.push("Tailor your summary and most relevant experience to the responsibilities in this specific job description.");
 return {score, rSkills, jSkills, skillMatches, missing, overlapTokens:overlapTokens.slice(0,12), tips};
}
function render(data, aiNote="") {
 $("emptyState").hidden=true; const target=$("results"); target.hidden=false;
 const score=Math.max(0,Math.min(100,data.score||0));
 target.innerHTML=`<div class="result-head"><h3>Your match insights</h3><span class="chip">ANALYSIS READY</span></div>
 <div class="score-wrap"><div class="score-ring" style="--score:${score}%"><strong>${score}%</strong></div><div><h4>${score>=75?"Strong keyword overlap":score>=45?"Some relevant overlap":"Opportunity to tailor"}</h4><p>This is an indicative text/skill overlap score, not a hiring prediction. Review the evidence below.</p></div></div>
 <div class="result-block"><h4>✓ MATCHING SKILLS (${data.skillMatches.length})</h4>${chipList(data.skillMatches)}</div>
 <div class="result-block"><h4>↗ SKILLS TO REVIEW (${data.missing.length})</h4>${chipList(data.missing,true)}</div>
 <div class="result-block"><h4>KEYWORD OVERLAP</h4>${chipList(data.overlapTokens||[])}</div>
 <div class="result-block"><h4>SUGGESTED NEXT STEPS</h4><ul class="suggestions">${(data.tips||[]).map(t=>`<li>${escapeHTML(t)}</li>`).join("")}</ul></div>
 ${aiNote?`<div class="result-block"><h4>AI NOTES</h4><p class="muted" style="font-size:12px;line-height:1.8">${escapeHTML(aiNote)}</p></div>`:""}
 <p class="result-disclaimer">This result is based on text matching and available skill terms. It may miss synonyms, context, and transferable skills. Verify all suggestions and never add experience you do not have.</p>`;
}
$("analyzeBtn").addEventListener("click", async()=>{
 const resume=resumeText.value.trim(), job=jobText.value.trim();
 if(resume.length<40 || job.length<40){alert("Please add a fuller resume and job description (at least a few sentences each).");return;}
 const btn=$("analyzeBtn"); btn.disabled=true; btn.textContent="Analyzing…";
 try {
   let data=analyzeLocal(resume,job), note="";
   // Optional serverless AI enhancement; local matching still works without an API key.
   try {
     const response=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({resume:resume.slice(0,12000),job:job.slice(0,10000)})});
     if(response.ok){const ai=await response.json(); if(ai && ai.note) note=ai.note;}
   } catch(_) {}
   render(data,note);
   $("resultsPanel").scrollIntoView({behavior:"smooth",block:"start"});
 } finally {btn.disabled=false;btn.innerHTML='Analyze match <span>→</span>';}
});
$("demoBtn").addEventListener("click",()=>{
 resumeText.value=`Hardik Manchanda\nBCA student interested in web development and AI.\nSkills: HTML, CSS, JavaScript, C++, Python, Git, GitHub, problem solving, data structures and algorithms.\nProjects: Built responsive web pages and a weather forecasting website using an API. Created a portfolio website and practiced frontend development.\nEducation: Bachelor of Computer Applications.`;
 jobText.value=`Frontend Developer Intern\nResponsibilities: Build responsive user interfaces using HTML, CSS and JavaScript. Work with APIs, Git and GitHub. Collaborate with a team to debug issues and improve usability.\nRequirements: Knowledge of JavaScript, HTML, CSS, React, REST APIs, Git, problem solving and communication. Personal or academic projects are a plus.`;
 $("fileStatus").textContent="Demo content loaded — replace with your own details.";
});
