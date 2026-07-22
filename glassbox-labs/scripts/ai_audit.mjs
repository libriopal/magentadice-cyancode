// Advisory Claude-API auditor. Non-ratifying (see governance/AI_AUDIT_LOOP_SPEC.md).
// Reads a diff on stdin + governance files, asks Claude to classify findings VF/SI/AS/SP/SC and flag
// gate-relevant/forbidden-field/consent/geo issues, writes evidence/audits/<ts>.md. Never grants gates.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const key = process.env.ANTHROPIC_API_KEY;              // G3 secret; human-provided
const model = process.env.AUDIT_MODEL || "claude-sonnet-4-6";
if (!key) { console.error("No ANTHROPIC_API_KEY (G3). Auditor is advisory; skipping."); process.exit(0); }
const diff = readFileSync(0, "utf8");
const gov = ["SOVEREIGNTY","ANTI_CIRCULARITY","HUMAN_GATES"].map(f=>readFileSync(`governance/${f}.md`,"utf8")).join("\n---\n");
const sys = "You are an ADVISORY auditor. You cannot ratify, deploy, or grant gates. Classify every finding VF/SI/AS/SP/SC. Flag any real-money, deploy, secrets, geo-legal, forbidden-field (skill_score/was_optimal), or consent issue and ROUTE it to a human gate. Agreement is not evidence.";
const r = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"content-type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01"},body:JSON.stringify({model,max_tokens:1500,system:sys,messages:[{role:"user",content:`GOVERNANCE:\n${gov}\n\nDIFF/BUILD:\n${diff}\n\nProduce an advisory audit report.`}]})});
const j = await r.json();
const text = (j.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("\n") || JSON.stringify(j);
mkdirSync("evidence/audits",{recursive:true});
const p = `evidence/audits/${new Date().toISOString().replace(/[:.]/g,"-")}.md`;
writeFileSync(p, `# Advisory AI Audit (non-ratifying)\n\n${text}\n`);
console.log("advisory audit written:", p);
