# AI 鏁板绉佹暀

瀵瑰簲浜у搧鏂囨。锛歚PRD-AI鏁板绉佹暀-MVP.md`銆傛牳蹇冮摼璺細**瀛╁瓙鎷嶇収 鈫?AI 鎵规敼 鈫?鐐归敊棰?鈫?AI 鍒嗘璁茶В锛堜笉缁欑瓟妗堬級鈫?閿欓钀藉簱**銆?

## 鎶€鏈爤涓庢灦鏋勫畾浣?

- **妗嗘灦**锛歍aro v4.3.0 + **React 18.3.1** + TypeScript + Sass
- **鈿狅笍 React 鐗堟湰绾︽潫锛堥噸瑕侊級**锛歍aro 4.x 鐨勫皬绋嬪簭杩愯鏃朵緷璧?React 18 鍐呴儴 API锛坄ReactCurrentBatchConfig` 绛夛級锛?
  **涓嶆敮鎸?React 19**鈥斺€斿疄娴嬪崌鍒?React 19 浼氬鑷村皬绋嬪簭**鐧藉睆**锛堥€昏緫灞傛姤 `Cannot read properties of undefined (reading 'ReactCurrentBatchConfig')`锛夈€?
  鍥犳鏈粨搴撻攣瀹?React 18.3.1锛?*React 19 鐣欑粰灏嗘潵鐨?RN 绔娇鐢?*锛圧N 鏂扮増鍩轰簬 React 19锛屼笌鏈洰鏍囩殑鏈€缁堟灦鏋勪竴鑷达級銆?
  鑻ュ悗缁?Taro 瀹樻柟鏀寔 React 19锛屽啀缁熶竴鍗囩骇銆?
- **鏋舵瀯瀹氫綅锛堥噸瑕侊級**锛?
  - 鏈粨搴?= **寰俊灏忕▼搴?MVP**锛屽敮涓€鐩殑鏄揩閫熼獙璇佷骇鍝佹€濊矾锛屼笉杩芥眰闀挎湡婕旇繘锛?
  - **鏈€缁堢Щ鍔ㄧ锛堢Щ鍔?App / 骞虫澘锛夊皢浣跨敤 React Native 鐙珛瀹炵幇**锛孴aro 涓嶆壙鎷呰鐩爣锛?
  - 鍥犳 `src/utils/` 涓嬬殑涓氬姟閫昏緫灞傦紙AI 璋冪敤 `ai.ts`銆佸瓨鍌?`store.ts`銆佺煡璇嗙偣 `knowledge.ts`锛夊繀椤讳繚鎸?*骞冲彴涓庢鏋舵棤鍏?*锛堢函 TS锛屼粎閫氳繃 `@tarojs/taro` 鐨勫瓨鍌?璇锋眰 API 鍋氳杽灏佽锛夛紝灏嗘潵 RN 绔彧鏇挎崲杩欏眰钖勫皝瑁呭嵆鍙暣浣撳鐢紱
  - 涓嶈鍦?`src/pages/` 閲屽啓澶嶆潅涓氬姟閫昏緫锛屼繚鎸侀〉闈㈢粍浠跺彧鍋氬睍绀轰笌浜や簰缂栨帓銆?
- **鍖呯鐞?*锛歱npm

## 鐩綍缁撴瀯

```
鈹溾攢鈹€ config/                  # Taro 鏋勫缓閰嶇疆锛坕ndex/dev/prod锛?
鈹溾攢鈹€ src/
鈹?  鈹溾攢鈹€ app.ts / app.config.ts / app.scss
鈹?  鈹溾攢鈹€ pages/
鈹?  鈹?  鈹溾攢鈹€ index/         # 棣栭〉锛氭媿鐓т笂浼?+ 涓夊叆鍙ｏ紙杩炲嚮/鍕嬬珷/鎶ュ憡锛?
鈹?  鈹?  鈹溾攢鈹€ result/        # 鎵规敼缁撴灉椤碉細閫愰 鉁?鉁楋紝浣庣疆淇″害鏍?寰呯‘璁?
鈹?  鈹?  鈹溾攢鈹€ tutor/         # AI 璁茶В瀵硅瘽椤碉細"鐪嬩竴姝ユ彁绀?鎹釜璇存硶/鎴戜細浜?
鈹?  鈹?  鈹溾攢鈹€ history/       # 鍘嗗彶鎵规敼璁板綍
鈹?  鈹?  鈹溾攢鈹€ book/          # 閿欓鏈細缁熻 + 鐘舵€佺瓫閫?+ 鎶ュ憡鍏ュ彛
鈹?  鈹?  鈹溾攢鈹€ wrong-detail/  # 閿欓璇︽儏锛欰I 鍐嶈 + 鍙樺紡缁冧範锛堝叏瀵归攢鍙凤級
鈹?  鈹?  鈹溾攢鈹€ report/        # 瀛︽儏鎶ュ憡锛氭敾鍏嬬巼/鍛ㄨ秼鍔?鐭ヨ瘑鐐规帉鎻?瀹堕暱寤鸿
鈹?  鈹?  鈹溾攢鈹€ medals/        # 鍕嬬珷澧欙細6 鏋氬媼绔?+ 姣忓懆鐩爣
鈹?  鈹?  鈹斺攢鈹€ mental/        # 鍙ｇ畻鎸戞垬锛?0 棰橀檺鏃讹紝閿欓杩涢敊棰樻湰
鈹?  鈹溾攢鈹€ utils/
鈹?  鈹?  鈹溾攢鈹€ config.ts       # 鈽?MODE: 'mock' | 'api' 鍒囨崲
鈹?  鈹?  鈹溾攢鈹€ ai.ts           # 鎵规敼/璁茶В/鍙樺紡鐢熸垚/鍒ょ瓟 + Prompt锛堝惈 Mock锛?
鈹?  鈹?  鈹溾攢鈹€ store.ts        # 瀛樺偍锛氭壒鏀?閿欓/閿€鍙?鎺屾彙搴?鎵撳崱/鍕嬬珷/鍛ㄧ洰鏍?
鈹?  鈹?  鈹溾攢鈹€ knowledge.ts    # 浜烘暀鐗堜簲涓婄煡璇嗙偣浣撶郴
鈹?  鈹?  鈹斺攢鈹€ mental.ts       # 鍙ｇ畻鏈湴鍑洪鍣紙5 绫婚鍨嬶級
鈹?  鈹斺攢鈹€ assets/icons/       # TabBar 鍥炬爣
鈹溾攢鈹€ scripts/
鈹?  鈹溾攢鈹€ e2e-mock.js         # 涓婚摼璺?e2e锛?9 椤规柇瑷€锛?
鈹?  鈹斺攢鈹€ e2e-mental.js       # 鍙ｇ畻閾捐矾 e2e锛?1 椤规柇瑷€锛?
鈹斺攢鈹€ project.config.json     # 寰俊寮€鍙戣€呭伐鍏烽厤缃紙miniprogramRoot: dist/锛?
```

## 甯哥敤鍛戒护

```bash
pnpm install          # 瀹夎渚濊禆
pnpm dev:weapp        # 灏忕▼搴忓紑鍙戯紙閰嶅悎寰俊寮€鍙戣€呭伐鍏锋墦寮€椤圭洰鏍圭洰褰曪級
pnpm build:weapp      # 灏忕▼搴忕敓浜ф瀯寤?鈫?dist/
```

## 寰俊寮€鍙戣€呭伐鍏疯仈璋?

宸ュ叿涓€屽鍏ラ」鐩€嶉€夋嫨**椤圭洰鏍圭洰褰?*锛坄project.config.json` 鎵€鍦ㄥ眰锛夛紝`miniprogramRoot` 鎸囧悜 `dist/`锛屽厛鎵ц `pnpm dev:weapp` 淇濇寔 watch 缂栬瘧銆傞粯璁?`MODE: 'mock'` 鏃犻渶鍚庣銆?

> **鑻ユ敼鍔ㄥ悗妯℃嫙鍣ㄨ〃鐜板紓甯革紙鐧藉睆绛夛級**锛氬厛鍒?`dist/` 閲嶆柊瀹屾暣缂栬瘧锛屽啀閲嶅惎寮€鍙戣€呭伐鍏枫€?
> 鏃т骇鐗╂畫鐣欎細浠ら€昏緫灞傚姞杞藉け鏁堜唬鐮併€?

## 鑷姩鍖栨祴璇?

```bash
# 1. 浠ヨ嚜鍔ㄥ寲绔彛鎵撳紑椤圭洰锛堥渶鍏堝湪宸ュ叿銆岃缃啋瀹夊叏璁剧疆銆嶅紑鍚湇鍔＄鍙ｏ級
& "C:\Program Files (x86)\Tencent\寰俊web寮€鍙戣€呭伐鍏穃cli.bat" auto --project <椤圭洰鏍圭洰褰? --auto-port 9420
# 2. 鍙﹀紑缁堢杩愯锛堥渶宸茬紪璇戞渶鏂扮増鍒?dist/锛?
pnpm build:weapp
node scripts/e2e-mock.js
```

`scripts/e2e-mock.js` 瑕嗙洊 Mock 妯″紡涓嬬殑瀹屾暣浜у搧闂幆锛?9 椤规柇瑷€锛夛細鎷嶇収鎵规敼 鈫?缁撴灉椤?鈫?AI 璁茶В瀵硅瘽 鈫?閿欓鏈紙缁熻/绛涢€夛級鈫?閿欓璇︽儏 + 鍙樺紡缁冧範閿€鍙?鈫?瀛︽儏鎶ュ憡 鈫?鍕嬬珷澧欍€?
`scripts/e2e-mental.js` 瑕嗙洊鍙ｇ畻鎸戞垬瀹屾暣閾捐矾锛?1 椤规柇瑷€锛夛細鍑洪 鈫?绛旈 鈫?浜ゅ嵎 鈫?閿欓鑷姩鍏ラ敊棰樻湰 鈫?閫愰鍥為【銆?

```bash
node scripts/e2e-mock.js    # 涓婚摼璺?
node scripts/e2e-mental.js  # 鍙ｇ畻閾捐矾
```

## 鍚庣绾﹀畾锛圓PI 妯″紡锛?

API Key 涓€寰嬫斁鏈嶅姟绔€傞渶瀹炵幇涓や釜鎺ュ彛锛堣瑙?`src/utils/ai.ts`锛夛細

- `POST /grade` 鈥?`{ images: [base64...] }` 鈫?`{ items: [{no, questionText, kidAnswer, correctAnswer, isCorrect, knowledgePoint, confidence}] }`
- `POST /chat` 鈥?`{ messages: [...] }` 鈫?`{ reply }`锛圫ystem Prompt 瑙?`TUTOR_SYSTEM_PROMPT`锛?

## Git 宸ヤ綔娴佽鑼?

瑙?`CONTRIBUTING.md`銆傝鐐癸細浠讳綍淇敼锛堝惈灏?bug锛夐兘蹇呴』璧?Git 娴佺▼鈥斺€旂嫭绔嬪垎鏀?+ 瑙勮寖鍖?commit message + 鍚堝苟鍥?master銆?

## MVP 楠岃瘉鎸囨爣

- 棰樼洰绾ф壒鏀瑰噯纭巼 鈮?90%
- 璁茶В鍚庤姝ｉ€氳繃鐜?鈮?70%
- 瀛╁瓙姣忓懆涓诲姩浣跨敤 鈮?4 澶?

## 鍚庣画鏂瑰悜锛圡VP 宸查棴鐜紝瑙?ROADMAP.md锛?

1. **鎺ョ湡瀹?AI**锛歚MODE: 'api'` + 鏋佺畝鍚庣鈥斺€旀壒鏀硅瘑鍒巼鏄骇鍝佸懡闂紝浼樺厛鍋?
2. 閿欓鎵撳嵃瀵煎嚭锛堝闀跨嚎涓嬭緟瀵煎満鏅級
3. 鍙樺紡棰橀毦搴﹁嚜閫傚簲
4. 澶氳澶囧悓姝ワ紙褰撳墠鍗曡澶囧瓨鍌級

