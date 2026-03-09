module.exports=[918622,(e,t,n)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},556704,(e,t,n)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},832319,(e,t,n)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},324725,(e,t,n)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},270406,(e,t,n)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},193695,(e,t,n)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},26500,e=>{"use strict";e.i(694879);var t=e.i(87022),n=e.i(493458);async function r(){let e=await (0,n.cookies)();return(0,t.createServerClient)("https://nvjbxnjgverjtarmhwmn.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52amJ4bmpndmVyanRhcm1od21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTgyOTgsImV4cCI6MjA4NzA5NDI5OH0.wcNsGwqrzvidjEPjvvqHwnssDGMSMvc0lr5DCiMVSLI",{cookies:{getAll:()=>e.getAll(),setAll(t){try{t.forEach(({name:t,value:n,options:r})=>e.set(t,n,r))}catch{}}}})}e.s(["createClient",()=>r])},909301,513716,e=>{"use strict";var t=e.i(469719);let n=t.z.object({symbol:t.z.string().optional(),position:t.z.string().optional(),entry_price:t.z.union([t.z.string(),t.z.number()]).optional(),exit_price:t.z.union([t.z.string(),t.z.number()]).nullable().optional(),pnl:t.z.union([t.z.string(),t.z.number()]).nullable().optional(),quantity:t.z.union([t.z.string(),t.z.number()]).optional(),fees:t.z.union([t.z.string(),t.z.number()]).optional(),emotion:t.z.string().nullable().optional(),confidence:t.z.number().nullable().optional(),process_score:t.z.number().nullable().optional(),setup_type:t.z.string().nullable().optional(),notes:t.z.string().nullable().optional(),tags:t.z.array(t.z.string()).nullable().optional(),open_timestamp:t.z.string().nullable().optional(),close_timestamp:t.z.string().nullable().optional(),checklist:t.z.record(t.z.string(),t.z.boolean()).nullable().optional(),review:t.z.record(t.z.string(),t.z.union([t.z.string(),t.z.number(),t.z.boolean()])).nullable().optional()}).passthrough(),r=t.z.object({message:t.z.string().min(1,"Message is required").max(5e3,"Message must be under 5000 characters"),trades:t.z.array(n).max(2e3).optional().default([]),context:t.z.object({weeklyReport:t.z.string().optional()}).passthrough().optional().default({}),provider:t.z.string().optional(),model:t.z.string().optional(),apiKey:t.z.string().max(256).optional()}),a=t.z.object({trade:n.refine(e=>e.symbol,{message:"Trade must have a symbol"}),provider:t.z.string().optional(),model:t.z.string().optional(),apiKey:t.z.string().max(256).optional()}),o=t.z.object({mode:t.z.literal("dashboard-insight"),context:t.z.string().max(2e3),trades:t.z.array(n).max(20),provider:t.z.string().optional(),model:t.z.string().optional(),apiKey:t.z.string().max(256).optional()});e.s(["AiChatSchema",0,r,"DashboardInsightSchema",0,o,"TradeSummarySchema",0,a],909301);var i=e.i(26500),s=e.i(189104),l=e.i(89171);let c={free:5,pro:50,max:0};async function d(e){let t=await (0,i.createClient)(),{data:n}=await t.from("user_subscriptions").select("tier, is_owner").eq("user_id",e).maybeSingle(),r=n?.tier??"free",a=n?.is_owner??!1,o=c[r]??5;if(a||0===o)return{allowed:!0};let d=await (0,s.rateLimit)(`ai-daily:${e}`,o,864e5);return d.success?{allowed:!0}:{allowed:!1,response:l.NextResponse.json({error:`Daily AI limit reached (${o}/day on ${r} plan). Upgrade for more.`,remaining:0,resetMs:d.resetMs},{status:429,headers:{"Retry-After":String(Math.ceil(d.resetMs/1e3))}})}}e.s(["checkAiDailyLimit",()=>d],513716)},130656,e=>{"use strict";let t=`You are Stargate AI — a trading psychology coach and pattern analyst built into a crypto trading journal.

Your role:
- Analyze trading data to find behavioral patterns, emotional tendencies, and process breakdowns
- Frame everything through a psychology + process lens (not just P&L)
- Be direct, specific, and actionable — no fluff
- Reference specific trades by symbol and date when making points
- Frame losses as "learning investments" and focus on what the trader did right process-wise
- Celebrate consistency and discipline over profits
- If you see concerning patterns (revenge trading, FOMO, ignoring stops), flag them clearly but constructively

Personality: Think of yourself as a calm, experienced trading mentor who's seen it all. You're supportive but honest. You don't sugarcoat, but you don't demoralize either.

## Destructive Pattern Detection

Use these criteria to identify patterns from the data — be specific, not vague:
- **Revenge trading**: 2+ entries within 30 min of a realized loss, or increased position size immediately after a loss
- **FOMO entry**: Entry with no setup type tagged, especially after a large green move in that symbol
- **Overtrading**: >5 trades in a single day, or >3 trades in the same symbol on the same day
- **Tilt cascade**: 3+ consecutive losses with declining process scores — the trader is spiraling
- **Disposition effect**: Avg winner is much smaller than avg loser despite a high win rate — cutting winners early, holding losers too long

## Cognitive Bias Coaching

When you detect these biases, use the coaching response:
- **Recency bias** (over-weighting last few trades): "Let's zoom out — what does your 30-trade sample say?"
- **Anchoring** (fixating on entry price): "Forget your entry. Would you take this trade right now at this price?"
- **Confirmation bias** (only seeing what confirms their view): "What would need to happen for you to be wrong here?"
- **Sunk cost** (adding to losers): "If you had no position, would you enter this trade fresh right now?"

## Process Score Interpretation

- **8-10**: Excellent discipline. Reinforce this. Ask what routine or mindset produced it.
- **5-7**: Partial adherence. Identify which specific rule was bent and why.
- **1-4**: Process breakdown. Ignore P&L entirely — focus only on what went wrong in the decision process.
- **Key rule**: High process score + loss = GOOD trade (unlucky, not undisciplined). Low process score + win = DANGEROUS trade (got lucky, will lose long-term). Coach accordingly.

## Emotion-Performance Matrix

Coach differently based on emotion tag + outcome:
- Confident + Win → reinforce, but watch for overconfidence creep
- Confident + Loss → healthy IF process score was high; flag if process was poor
- Anxious + Win → was the position too small? Did they exit too early out of fear?
- Revenge/FOMO + any outcome → immediate flag, pattern interrupt: "Stop. Step away. Review your rules."
- Calm/Neutral → this is the ideal state. Celebrate it and ask what pre-trade routine produced it.

## Statistical Guidance

Avoid misleading conclusions:
- <30 closed trades = not enough data to judge edge. Say so explicitly.
- Win rate alone is meaningless — always pair with risk:reward ratio.
- Win rate <40% with avg winner >2x avg loser = valid edge. Explain why this is fine.
- Profit factor: >1.5 = solid, >2.0 = excellent, <1.0 = losing money. Frame accordingly.
- Never give trade ideas or market predictions. You coach process and psychology, not entries.

Format rules:
- Use markdown for formatting
- Keep responses focused and concise (200-400 words typically)
- Use bullet points for actionable items
- Bold key insights`;function n(e,t){if(0===e.length)return"No trade data available yet. The user is asking a general trading question.";let n=e.filter(e=>e.close_timestamp),r=e.filter(e=>!e.close_timestamp),a=n.reduce((e,t)=>e+(Number(t.pnl)||0),0),o=n.filter(e=>(Number(e.pnl)||0)>0),i=n.filter(e=>0>=(Number(e.pnl)||0)),s=n.length>0?(o.length/n.length*100).toFixed(1):"N/A",l=o.length>0?(o.reduce((e,t)=>e+(Number(t.pnl)||0),0)/o.length).toFixed(2):"N/A",c=i.length>0?(i.reduce((e,t)=>e+(Number(t.pnl)||0),0)/i.length).toFixed(2):"N/A",d=n.map(e=>Number(e.pnl)||0),u=d.length>0?Math.max(...d).toFixed(2):"N/A",p=d.length>0?Math.min(...d).toFixed(2):"N/A",g=o.reduce((e,t)=>e+(Number(t.pnl)||0),0),m=Math.abs(i.reduce((e,t)=>e+(Number(t.pnl)||0),0)),h=m>0?(g/m).toFixed(2):"∞",y={};for(let e of n){let t=String(e.emotion||"Untagged");y[t]||(y[t]={count:0,pnl:0,wins:0}),y[t].count++,y[t].pnl+=Number(e.pnl)||0,(Number(e.pnl)||0)>0&&y[t].wins++}let f=n.filter(e=>null!=e.process_score).map(e=>Number(e.process_score)),w=f.length>0?(f.reduce((e,t)=>e+t,0)/f.length).toFixed(1):"N/A",b=f.slice(-10),x=b.length>0?(b.reduce((e,t)=>e+t,0)/b.length).toFixed(1):"N/A",v={};for(let e of n){let t=String(e.symbol||"Unknown");v[t]||(v[t]={count:0,pnl:0,wins:0}),v[t].count++,v[t].pnl+=Number(e.pnl)||0,(Number(e.pnl)||0)>0&&v[t].wins++}let $=Object.entries(v).sort((e,t)=>t[1].pnl-e[1].pnl),R=$.slice(0,3),N=$.slice(-3).reverse(),A={};for(let e of n){let t=String(e.setup_type||"No setup");A[t]||(A[t]={count:0,pnl:0,wins:0}),A[t].count++,A[t].pnl+=Number(e.pnl)||0,(Number(e.pnl)||0)>0&&A[t].wins++}let C=0,S="",z=0,E=0,k=0,P=0;for(let e of n)(Number(e.pnl)||0)>0?(P=0,++k>z&&(z=k)):(k=0,++P>E&&(E=P));S=(C=k>0?k:-P)>0?"wins":C<0?"losses":"neutral";let T={};for(let e of n){let t=String(e.close_timestamp||e.open_timestamp||"").split("T")[0];t&&(T[t]=(T[t]||0)+1)}let O=Object.entries(T).filter(([,e])=>e>5),j=new Date,I=[];for(let e=3;e>=0;e--){let t=new Date(j);t.setDate(t.getDate()-(e+1)*7);let r=new Date(j);r.setDate(r.getDate()-7*e);let a=n.filter(e=>{let n=new Date(String(e.close_timestamp||""));return n>=t&&n<r}),o=a.reduce((e,t)=>e+(Number(t.pnl)||0),0);I.push({week:`${t.toISOString().split("T")[0]} → ${r.toISOString().split("T")[0]}`,pnl:o,count:a.length})}let _=`## Trading Summary (Full Journal: ${n.length} closed trades)
- **Total P&L**: $${a.toFixed(2)}
- **Win rate**: ${s}% (${o.length}W / ${i.length}L)
- **Avg winner**: $${l} | **Avg loser**: $${c}
- **Largest win**: $${u} | **Largest loss**: $${p}
- **Profit factor**: ${h}
- **Open positions**: ${r.length}

## Process Discipline
- **Avg process score**: ${w}/10 (overall) | ${x}/10 (last 10 trades)
- **Trend**: ${"N/A"!==w&&"N/A"!==x?Number(x)>Number(w)?"Improving ↑":Number(x)<Number(w)?"Declining ↓":"Stable →":"N/A"}

## Streaks
- **Current**: ${Math.abs(C)} ${S}
- **Max win streak**: ${z} | **Max loss streak**: ${E}

## Emotion Breakdown
${Object.entries(y).sort((e,t)=>t[1].count-e[1].count).map(([e,t])=>`- ${e}: ${t.count} trades, WR ${t.count>0?(t.wins/t.count*100).toFixed(0):0}%, P&L $${t.pnl.toFixed(2)}`).join("\n")}

## Top Symbols (by P&L)
${R.map(([e,t])=>`- ${e}: ${t.count} trades, WR ${(t.wins/t.count*100).toFixed(0)}%, P&L $${t.pnl.toFixed(2)}`).join("\n")}

## Worst Symbols (by P&L)
${N.map(([e,t])=>`- ${e}: ${t.count} trades, WR ${(t.wins/t.count*100).toFixed(0)}%, P&L $${t.pnl.toFixed(2)}`).join("\n")}

## Setup Performance
${Object.entries(A).sort((e,t)=>t[1].count-e[1].count).slice(0,6).map(([e,t])=>`- ${e}: ${t.count} trades, WR ${(t.wins/t.count*100).toFixed(0)}%, P&L $${t.pnl.toFixed(2)}`).join("\n")}

## Weekly Trend (last 4 weeks)
${I.map(e=>`- ${e.week}: $${e.pnl.toFixed(2)} (${e.count} trades)`).join("\n")}
${O.length>0?`
## Overtrading Alerts
${O.length} day(s) with >5 trades: ${O.map(([e,t])=>`${e} (${t})`).join(", ")}`:""}

## Recent Trades (last 20)
`;for(let t of e.slice(0,20)){let e=null!=t.pnl?`$${Number(t.pnl).toFixed(2)}`:"OPEN",n=t.close_timestamp?String(t.close_timestamp).split("T")[0]:String(t.open_timestamp).split("T")[0];_+=`- ${n} | ${t.symbol} ${t.position} | P&L: ${e} | Emotion: ${t.emotion||"—"} | Confidence: ${t.confidence??"—"}/10 | Process: ${t.process_score??"—"}/10 | Setup: ${t.setup_type||"—"}`,t.notes&&(_+=` | Notes: ${String(t.notes).slice(0,80)}`),_+="\n"}return t.weeklyReport&&(_+=`
## Additional Context
${t.weeklyReport}
`),_}e.s(["AI_CHAT_SYSTEM_PROMPT",0,t,"buildTradeContext",()=>n])},560138,e=>{"use strict";var t=e.i(747909),n=e.i(174017),r=e.i(996250),a=e.i(759756),o=e.i(561916),i=e.i(174677),s=e.i(869741),l=e.i(316795),c=e.i(487718),d=e.i(995169),u=e.i(47587),p=e.i(666012),g=e.i(570101),m=e.i(626937),h=e.i(10372),y=e.i(193695);e.i(52474);var f=e.i(257297),w=e.i(89171),b=e.i(26500),x=e.i(909301),v=e.i(189104),$=e.i(513716),R=e.i(130656);e.i(843911);var N=e.i(308411);async function A(e){let t=await (0,b.createClient)(),{data:{user:n}}=await t.auth.getUser();if(!n)return w.NextResponse.json({error:"Unauthorized"},{status:401});let r=await (0,v.rateLimit)(`ai-chat:${n.id}`,20,6e4);if(!r.success)return w.NextResponse.json({error:"Too many requests. Please wait before trying again."},{status:429,headers:{"Retry-After":String(Math.ceil(r.resetMs/1e3))}});let a=await (0,$.checkAiDailyLimit)(n.id);if(!a.allowed)return a.response;let o=await e.json(),i=x.AiChatSchema.safeParse(o);if(!i.success){let e=i.error.issues.map(e=>e.message).join(", ");return w.NextResponse.json({error:e},{status:400})}let{message:s,trades:l,context:c,provider:d,model:u,apiKey:p}=i.data,g=(0,N.getProvider)(d,p);if(!g.isConfigured(p))return w.NextResponse.json({error:"AI service not configured. Add your own API key in Settings → AI Coach."},{status:500});let m=(0,N.resolveModel)(g.id,u),h=(0,R.buildTradeContext)(l,c);try{let e=g.stream({system:R.AI_CHAT_SYSTEM_PROMPT,userMessage:`Here is my trading data:

${h}

My question: ${s}`,maxTokens:1024,model:m,apiKey:p}),t=new TextEncoder,n=new ReadableStream({async start(n){try{for await(let r of e)n.enqueue(t.encode(`data: ${JSON.stringify({text:r})}

`));n.enqueue(t.encode("data: [DONE]\n\n")),n.close()}catch(e){n.enqueue(t.encode(`data: ${JSON.stringify({error:e instanceof Error?e.message:"Stream error"})}

`)),n.close()}}});return new Response(n,{headers:{"Content-Type":"text/event-stream","Cache-Control":"no-cache",Connection:"keep-alive"}})}catch(t){let e=t instanceof Error?t.message:"Unknown error";return w.NextResponse.json({error:e},{status:500})}}e.s(["POST",()=>A],392862);var C=e.i(392862);let S=new t.AppRouteRouteModule({definition:{kind:n.RouteKind.APP_ROUTE,page:"/api/ai/stream/route",pathname:"/api/ai/stream",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/ai/stream/route.ts",nextConfigOutput:"",userland:C}),{workAsyncStorage:z,workUnitAsyncStorage:E,serverHooks:k}=S;function P(){return(0,r.patchFetch)({workAsyncStorage:z,workUnitAsyncStorage:E})}async function T(e,t,r){S.isDev&&(0,a.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let w="/api/ai/stream/route";w=w.replace(/\/index$/,"")||"/";let b=await S.prepare(e,t,{srcPage:w,multiZoneDraftMode:!1});if(!b)return t.statusCode=400,t.end("Bad Request"),null==r.waitUntil||r.waitUntil.call(r,Promise.resolve()),null;let{buildId:x,params:v,nextConfig:$,parsedUrl:R,isDraftMode:N,prerenderManifest:A,routerServerContext:C,isOnDemandRevalidate:z,revalidateOnlyGenerated:E,resolvedPathname:k,clientReferenceManifest:P,serverActionsManifest:T}=b,O=(0,s.normalizeAppPath)(w),j=!!(A.dynamicRoutes[O]||A.routes[k]),I=async()=>((null==C?void 0:C.render404)?await C.render404(e,t,R,!1):t.end("This page could not be found"),null);if(j&&!N){let e=!!A.routes[k],t=A.dynamicRoutes[O];if(t&&!1===t.fallback&&!e){if($.experimental.adapterPath)return await I();throw new y.NoFallbackError}}let _=null;!j||S.isDev||N||(_="/index"===(_=k)?"/":_);let M=!0===S.isDev||!j,F=j&&!M;T&&P&&(0,i.setManifestsSingleton)({page:w,clientReferenceManifest:P,serverActionsManifest:T});let D=e.method||"GET",q=(0,o.getTracer)(),L=q.getActiveScopeSpan(),U={params:v,prerenderManifest:A,renderOpts:{experimental:{authInterrupts:!!$.experimental.authInterrupts},cacheComponents:!!$.cacheComponents,supportsDynamicResponse:M,incrementalCache:(0,a.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:$.cacheLife,waitUntil:r.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,n,r,a)=>S.onRequestError(e,t,r,a,C)},sharedContext:{buildId:x}},H=new l.NodeNextRequest(e),W=new l.NodeNextResponse(t),K=c.NextRequestAdapter.fromNodeNextRequest(H,(0,c.signalFromNodeResponse)(t));try{let i=async e=>S.handle(K,U).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let n=q.getRootSpanAttributes();if(!n)return;if(n.get("next.span_type")!==d.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${n.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let r=n.get("next.route");if(r){let t=`${D} ${r}`;e.setAttributes({"next.route":r,"http.route":r,"next.span_name":t}),e.updateName(t)}else e.updateName(`${D} ${w}`)}),s=!!(0,a.getRequestMeta)(e,"minimalMode"),l=async a=>{var o,l;let c=async({previousCacheEntry:n})=>{try{if(!s&&z&&E&&!n)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let o=await i(a);e.fetchMetrics=U.renderOpts.fetchMetrics;let l=U.renderOpts.pendingWaitUntil;l&&r.waitUntil&&(r.waitUntil(l),l=void 0);let c=U.renderOpts.collectedTags;if(!j)return await (0,p.sendResponse)(H,W,o,U.renderOpts.pendingWaitUntil),null;{let e=await o.blob(),t=(0,g.toNodeOutgoingHttpHeaders)(o.headers);c&&(t[h.NEXT_CACHE_TAGS_HEADER]=c),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let n=void 0!==U.renderOpts.collectedRevalidate&&!(U.renderOpts.collectedRevalidate>=h.INFINITE_CACHE)&&U.renderOpts.collectedRevalidate,r=void 0===U.renderOpts.collectedExpire||U.renderOpts.collectedExpire>=h.INFINITE_CACHE?void 0:U.renderOpts.collectedExpire;return{value:{kind:f.CachedRouteKind.APP_ROUTE,status:o.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:n,expire:r}}}}catch(t){throw(null==n?void 0:n.isStale)&&await S.onRequestError(e,t,{routerKind:"App Router",routePath:w,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:F,isOnDemandRevalidate:z})},!1,C),t}},d=await S.handleResponse({req:e,nextConfig:$,cacheKey:_,routeKind:n.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:A,isRoutePPREnabled:!1,isOnDemandRevalidate:z,revalidateOnlyGenerated:E,responseGenerator:c,waitUntil:r.waitUntil,isMinimalMode:s});if(!j)return null;if((null==d||null==(o=d.value)?void 0:o.kind)!==f.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(l=d.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});s||t.setHeader("x-nextjs-cache",z?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),N&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let y=(0,g.fromNodeOutgoingHttpHeaders)(d.value.headers);return s&&j||y.delete(h.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||y.get("Cache-Control")||y.set("Cache-Control",(0,m.getCacheControlHeader)(d.cacheControl)),await (0,p.sendResponse)(H,W,new Response(d.value.body,{headers:y,status:d.value.status||200})),null};L?await l(L):await q.withPropagatedContext(e.headers,()=>q.trace(d.BaseServerSpan.handleRequest,{spanName:`${D} ${w}`,kind:o.SpanKind.SERVER,attributes:{"http.method":D,"http.target":e.url}},l))}catch(t){if(t instanceof y.NoFallbackError||await S.onRequestError(e,t,{routerKind:"App Router",routePath:O,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:F,isOnDemandRevalidate:z})},!1,C),j)throw t;return await (0,p.sendResponse)(H,W,new Response(null,{status:500})),null}}e.s(["handler",()=>T,"patchFetch",()=>P,"routeModule",()=>S,"serverHooks",()=>k,"workAsyncStorage",()=>z,"workUnitAsyncStorage",()=>E],560138)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__ddcbb340._.js.map