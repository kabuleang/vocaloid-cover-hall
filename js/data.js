/**
 * 声之回响 · 作品数据
 * -----------------------------------------------
 * 新增作品：在 SONGS 数组末尾追加一个对象即可，字段说明见下方。
 * 所有链接为外部平台（B 站 / 网易云 / YouTube）的搜索入口，
 * 网站本身不存储任何音视频文件。
 */

/* 歌姬配色（用于生成封面与标签） */
window.VS_SINGERS = {
  luotianyi:    { name: "洛天依",   c1: "#39c5e8", c2: "#0f6fa8" },
  yuezhengling: { name: "乐正绫",   c1: "#ff5f8f", c2: "#b0245a" },
  yanhe:        { name: "言和",     c1: "#2ad4cf", c2: "#0a7f8f" },
  xinhua:       { name: "心华",     c1: "#ffb35c", c2: "#d96b00" },
  miku:         { name: "初音未来", c1: "#41d8cf", c2: "#0b7f8f" },
  xingchen:     { name: "星尘",     c1: "#b79cff", c2: "#6f4fd8" }
};

/* 作品列表 */
window.VS_SONGS = [
  {
    id: "qianbenying",
    title: "千本桜",
    original: "千本桜",
    originalArtist: "黒うさP",
    singer: "luotianyi",
    genre: ["和风", "电子"],
    year: 2019,
    duration: "03:54",
    views: 326000,
    likes: 12800,
    desc: "经典和风电音曲目翻唱，洛天依清亮的声线演绎樱花纷飞中的夏日盛景，副歌部分一气呵成。"
  },
  {
    id: "qifengle",
    title: "起风了",
    original: "起风了",
    originalArtist: "買辣椒也用券",
    singer: "luotianyi",
    genre: ["流行"],
    year: 2020,
    duration: "04:48",
    views: 512000,
    likes: 23400,
    desc: "年度热歌翻唱，温柔的吐字像是风起时的一场告别与重逢，适合在傍晚循环播放。"
  },
  {
    id: "weifengtangtang",
    title: "威风堂堂",
    original: "威风堂堂",
    originalArtist: "梅とら",
    singer: "luotianyi",
    genre: ["电子", "流行"],
    year: 2018,
    duration: "04:12",
    views: 428000,
    likes: 19600,
    desc: "洛天依与乐正绫双歌姬合唱经典电音曲目，节奏感拉满，和声编排堪称教科书级别。"
  },
  {
    id: "haidi",
    title: "海底",
    original: "海底",
    originalArtist: "一支榴莲",
    singer: "luotianyi",
    genre: ["治愈", "抒情"],
    year: 2021,
    duration: "04:16",
    views: 301000,
    likes: 15800,
    desc: "深海般的孤独与温柔，洛天依的声音仿佛从水面之下传来，治愈每一个深夜的人。"
  },
  {
    id: "guyongzhe",
    title: "孤勇者",
    original: "孤勇者",
    originalArtist: "陈奕迅",
    singer: "yuezhengling",
    genre: ["流行", "摇滚"],
    year: 2022,
    duration: "04:12",
    views: 389000,
    likes: 17600,
    desc: "热血翻唱，乐正绫的高音把平凡英雄的倔强唱得淋漓尽致，副歌极具爆发力。"
  },
  {
    id: "mangzhong",
    title: "芒种",
    original: "芒种",
    originalArtist: "音阙诗听 & 赵方婧",
    singer: "luotianyi",
    genre: ["古风", "电子"],
    year: 2019,
    duration: "03:36",
    views: 287000,
    likes: 14300,
    desc: "古风与电子融合的流行佳作，洛天依的演绎为夏日芒种平添一分清凉与热烈。"
  },
  {
    id: "hongzhaoyuan",
    title: "红昭愿",
    original: "红昭愿",
    originalArtist: "音阙诗听",
    singer: "yuezhengling",
    genre: ["古风"],
    year: 2018,
    duration: "03:52",
    views: 254000,
    likes: 12100,
    desc: "国风佳作翻唱，朱砂色的相思在弦音与戏腔中缓缓晕开，韵味十足。"
  },
  {
    id: "dayu",
    title: "大鱼",
    original: "大鱼",
    originalArtist: "周深",
    singer: "yanhe",
    genre: ["抒情", "古风"],
    year: 2019,
    duration: "05:08",
    views: 342000,
    likes: 18700,
    desc: "空灵翻唱，言和通透的中性声线让这首《大鱼》有了全然不同的味道。"
  },
  {
    id: "lemon",
    title: "Lemon",
    original: "Lemon",
    originalArtist: "米津玄師",
    singer: "miku",
    genre: ["流行"],
    year: 2018,
    duration: "04:20",
    views: 276000,
    likes: 13200,
    desc: "初音未来翻唱日系经典，电子音色的重新演绎带来别样的温暖与释然。"
  },
  {
    id: "qinghuaci",
    title: "青花瓷",
    original: "青花瓷",
    originalArtist: "周杰伦",
    singer: "yanhe",
    genre: ["国风"],
    year: 2020,
    duration: "04:02",
    views: 218000,
    likes: 9800,
    desc: "青瓷釉色与电子声线相遇，言和的版本把国风唱出了清新通透的科技感。"
  },
  {
    id: "cuoweishikong",
    title: "错位时空",
    original: "错位时空",
    originalArtist: "艾辰",
    singer: "luotianyi",
    genre: ["流行"],
    year: 2021,
    duration: "03:54",
    views: 356000,
    likes: 16900,
    desc: "跨越时空的思念，洛天依唱尽了遗憾与释然，副歌部分直击人心。"
  },
  {
    id: "quantianxia",
    title: "权御天下",
    original: "权御天下",
    originalArtist: "ilem",
    singer: "yuezhengling",
    genre: ["古风", "摇滚"],
    year: 2015,
    duration: "03:28",
    views: 468000,
    likes: 22600,
    desc: "三国名场面战歌，鼓点、戏腔与摇滚编曲齐飞，乐正绫的翻唱气势磅礴。"
  },
  {
    id: "dalabangba",
    title: "达拉崩吧",
    original: "达拉崩吧",
    originalArtist: "ilem",
    singer: "xinhua",
    genre: ["搞笑", "电子"],
    year: 2020,
    duration: "03:32",
    views: 197000,
    likes: 8800,
    desc: "一人分饰多角挑战年度洗脑神曲，心华的声线切换流畅又欢乐。"
  },
  {
    id: "putongdisco",
    title: "普通DISCO",
    original: "普通DISCO",
    originalArtist: "ilem",
    singer: "xingchen",
    genre: ["电子", "流行"],
    year: 2016,
    duration: "03:40",
    views: 233000,
    likes: 10900,
    desc: "复古迪斯科与星尘透明声线的奇妙碰撞，复古与未来感并存。"
  }
];
