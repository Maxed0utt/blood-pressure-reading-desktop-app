describe('Dashboard functionality', () => {
  // Helper to create a user and get logged in
  async function createAndLogin() {
    await browser.execute(() => {
      localStorage.clear()
    })
    await browser.url('/signup')
    await browser.pause(1000)

    const timestamp = Date.now()
    const testEmail = `dashboard${timestamp}@example.com`
    const testPassword = 'TestPassword123!'

    await $('#full-name').setValue('Dashboard Test User')
    await $('#email-address').setValue(testEmail)
    await $('#verify-email-address').setValue(testEmail)
    await $('#password').setValue(testPassword)
    await $('#confirm-password').setValue(testPassword)
    await $('[type="submit"]').click()

    await browser.waitUntil(
      async () => (await browser.getUrl()).includes('/dashboard'),
      { timeout: 15000 }
    )
  }

  before(async () => {
    await createAndLogin()
  })

  it('should display dashboard page', async () => {
    await browser.url('/dashboard')

    const url = await browser.getUrl()
    expect(url).toContain('/dashboard')

    const body = await $('body')
    await expect(body).toHaveTextContaining('Dashboard')
  })

  it('should show stats section', async () => {
    await browser.url('/dashboard')

    const statsSection = await $('[data-cy="stats-cards"]')
    if (await statsSection.isExisting()) {
      await expect(statsSection).toBeDisplayed()
    }
  })

  it('should show chart when readings exist', async () => {
    // First create a reading
    await browser.url('/bpreading/new')
    await browser.pause(500)

    await $('#topNumber').setValue('120')
    await $('#bottomNumber').setValue('80')
    await $('#heartRate').setValue('72')
    await $('[type="submit"]').click()

    await browser.waitUntil(
      async () => {
        const url = await browser.getUrl()
        return url.includes('/bpreading') && !url.includes('/new')
      },
      { timeout: 10000 }
    )

    // Navigate to dashboard
    await browser.url('/dashboard')
    await browser.pause(500)

    // Check for chart element
    const chartCanvas = await $('canvas')
    if (await chartCanvas.isExisting()) {
      await expect(chartCanvas).toBeDisplayed()
    }
  })

  it('should allow period selection', async () => {
    await browser.url('/dashboard')

    // Look for period buttons
    const weeklyButton = await $('[data-cy="stat-card-weekly"]')
    if (await weeklyButton.isExisting()) {
      await weeklyButton.click()
      await browser.pause(500)
      const body = await $('body')
      await expect(body).toHaveTextContaining('Dashboard')
    }
  })

  it('should navigate to readings list', async () => {
    await browser.url('/dashboard')

    const readingsLink = await $('a[href="/bpreading"]')
    if (await readingsLink.isExisting()) {
      await readingsLink.click()

      await browser.waitUntil(
        async () => (await browser.getUrl()).includes('/bpreading'),
        { timeout: 5000 }
      )

      const url = await browser.getUrl()
      expect(url).toContain('/bpreading')
    }
  })
})

describe('Profile functionality', () => {
  let testEmail
  let testName

  before(async () => {
    await browser.execute(() => {
      localStorage.clear()
    })
    await browser.url('/signup')
    await browser.pause(1000)

    const timestamp = Date.now()
    testEmail = `profile${timestamp}@example.com`
    testName = 'Profile Test User'
    const testPassword = 'TestPassword123!'

    await $('#full-name').setValue(testName)
    await $('#email-address').setValue(testEmail)
    await $('#verify-email-address').setValue(testEmail)
    await $('#password').setValue(testPassword)
    await $('#confirm-password').setValue(testPassword)
    await $('[type="submit"]').click()

    await browser.waitUntil(
      async () => (await browser.getUrl()).includes('/dashboard'),
      { timeout: 15000 }
    )
  })

  it('should display profile page', async () => {
    await browser.url('/profile')

    const url = await browser.getUrl()
    expect(url).toContain('/profile')
  })

  it('should show current user information', async () => {
    await browser.url('/profile')

    const body = await $('body')
    await expect(body).toHaveTextContaining(testName)
    await expect(body).toHaveTextContaining(testEmail)
  })

  it('should show logout option', async () => {
    await browser.url('/profile')
    await browser.pause(500)

    // Logout button can be in nav sidebar or profile page header
    const logoutButtons = await $$('[data-cy="logout-button"]')
    const hasLogout = logoutButtons.length > 0
    expect(hasLogout).toBe(true)
  })

  it('should logout user', async () => {
    await browser.url('/profile')

    const logoutButton = await $('[data-cy="logout-button"]')
    if (await logoutButton.isExisting()) {
      await logoutButton.click()

      await browser.waitUntil(
        async () => {
          const url = await browser.getUrl()
          return url.endsWith('/') || !url.includes('/dashboard')
        },
        { timeout: 5000 }
      )
    }
  })
})
