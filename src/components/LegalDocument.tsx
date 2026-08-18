import { brand, displayContact, displayOperator, siteConfig } from '../config/site'

type LegalPage = 'privacy' | 'terms'

const updatedAt = '2026年8月19日'

function PrivacyPolicy() {
  return (
    <>
      <h1>{brand.full} 隐私政策</h1>
      <p>更新日期：{updatedAt}</p>
      <h2>一、适用范围</h2>
      <p>本政策适用于由{displayOperator}提供的{brand.full}旅行路线动画工具。</p>
      <h2>二、当前版本处理的数据</h2>
      <p>当前版本无需注册账号。行程名称、地点、交通工具、语言和主题等编辑数据仅保存在你的浏览器本地存储中；视频由浏览器在本地生成并下载。当前版本不会主动将上述内容上传到服务器。</p>
      <h2>三、设备权限与文件</h2>
      <p>导出视频时，浏览器会使用 Canvas 和媒体录制能力，并向你发起文件下载。{brand.zh}不会在未获得授权的情况下访问通讯录、相册、精确位置、摄像头或麦克风。</p>
      <h2>四、日志与安全</h2>
      <p>网站托管服务商可能按照网络安全和运维要求记录访问时间、IP 地址、浏览器类型、请求状态等必要日志。上线后如接入统计或错误监控服务，本政策会在启用前更新并说明服务商、目的和处理范围。</p>
      <h2>五、数据删除</h2>
      <p>你可以通过浏览器的站点数据或本地存储管理功能删除已保存的行程。卸载浏览器、清理站点数据或使用无痕模式也可能导致本地行程丢失。</p>
      <h2>六、未成年人保护</h2>
      <p>未成年人应在监护人指导下使用本工具，不应在行程名称等字段中填写真实姓名、联系方式或其他不必要的个人信息。</p>
      <h2>七、联系我们</h2>
      <p>运营者：{displayOperator}<br />联系邮箱：{displayContact}</p>
    </>
  )
}

function TermsOfUse() {
  return (
    <>
      <h1>{brand.full} 使用条款</h1>
      <p>更新日期：{updatedAt}</p>
      <h2>一、服务说明</h2>
      <p>{brand.zh}提供旅行路线编辑、动画预览和浏览器端视频导出功能。地图、城市坐标和非航空路线仅用于视觉展示，不构成导航、测绘、交通规划或安全建议。</p>
      <h2>二、用户责任</h2>
      <p>你应确保输入内容以及导出视频的使用、发布和分享符合法律法规，不侵犯他人的著作权、商标权、隐私权、肖像权或其他合法权益。</p>
      <h2>三、服务限制</h2>
      <p>浏览器、设备性能和编码器支持可能影响动画帧率、导出时长及视频格式。运营者会合理维护服务，但不承诺服务始终不中断、完全无误或适用于所有设备。</p>
      <h2>四、知识产权与数据来源</h2>
      <p>{brand.zh}的程序、界面与品牌元素受相关法律保护。地图影像、行政边界和城市数据分别依照项目公示的数据来源及许可使用。</p>
      <h2>五、条款更新</h2>
      <p>功能、法律要求或数据处理方式发生变化时，本条款可能更新。重大变化会通过页面提示等合理方式告知。</p>
      <h2>六、联系我们</h2>
      <p>运营者：{displayOperator}<br />联系邮箱：{displayContact}</p>
    </>
  )
}

export function LegalDocument({ page }: { page: LegalPage }) {
  return (
    <main className="min-h-dvh overflow-auto bg-[#061018] px-5 py-10 text-slate-300">
      <article className="legal-document mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[.04] p-6 shadow-2xl sm:p-10">
        {page === 'privacy' ? <PrivacyPolicy /> : <TermsOfUse />}
        <div className="mt-10 border-t border-white/10 pt-5 text-xs text-slate-500">
          <a href={siteConfig.siteUrl || import.meta.env.BASE_URL} className="text-cyan-300 hover:text-cyan-200">返回{brand.zh}</a>
        </div>
      </article>
    </main>
  )
}

export type { LegalPage }
