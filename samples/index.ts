/******** Load all samples in /src/sample/ ********/
{
    // find all demos in /sample
    const modules = import.meta.glob(['./*/*.ts', '!./*/_*.ts'])

    // create menu
    let title = '', list = `<svg onclick="document.body.classList.remove('show')" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" class="close"><path fill="currentColor" d="M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z"></path></svg>`
    for (const path in modules) {
        if (!path.includes('Sample_')) continue
        const arr = path.split('/')
        const _title = arr[1]
        const _demo = arr[2].replace(/Sample_|\.ts/g, '')
        if (_title != title) {
            list += `<p>${_title}</p>`
            title = _title
        }
        list += `<a id="${path}">${_demo}</a>`
    }

    const menu = document.createElement('div')
    menu.className = 'menu'
    menu.innerHTML = list
    document.body.appendChild(menu)

    // apply the same "fullscreen canvas" style that used to live in the iframe
    {
        const style = document.createElement('style')
        style.textContent = `
            html, body { margin: 0; padding: 0; overflow: hidden; }
            canvas { touch-action: none; }
        `
        document.head.appendChild(style)
    }

    // helper: load and run a sample directly in this page (no iframe)
    async function loadSample(target: string) {
        const importer = modules[target]
        if (!importer)
            return

        // remove previous canvases to avoid stacking multiple samples
        document.querySelectorAll('canvas').forEach(c => c.remove())

        const m = await importer()
        for (const key in m as Record<string, unknown>) {
            const Ctor = (m as Record<string, any>)[key]
            if (typeof Ctor === 'function') {
                const instance = new Ctor()
                if (typeof instance.run === 'function') {
                    instance.run()
                }
                break
            }
        }
    }

    // change sessionStorage.target on click, and load sample in-page
    menu.addEventListener('click', (e: Event) => {
        const button = e.target as HTMLElement
        if (!button.id)
            return

        const target = button.id
        if (target && modules[target]) {
            loadSample(target)
            document.querySelector('.active')?.classList.remove('active')
            button.classList.add('active')
            sessionStorage.top = menu.scrollTop
            sessionStorage.target = target
        }
    })

    // load target on refresh
    if (sessionStorage.target) {
        const target = sessionStorage.target as string
        const a = document.querySelector(`[id="${target}"]`) as HTMLElement | null
        if (a) {
            loadSample(target)
            a.classList.add('active')
            menu.scrollTop = sessionStorage.top
        }
    } else {
        // fallback: click the first sample
        (document.querySelector('a') as HTMLElement | null)?.click()
    }
}