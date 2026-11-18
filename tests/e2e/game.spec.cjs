const { test, expect } = require('@playwright/test');

const names = ['Persona Alfa QA', 'Persona Beta QA', 'Persona Gamma QA'];

async function setupGame(page, playerNames = names, rounds = 2) {
  await page.goto('/');
  await page.getByLabel('¿Cuántos vais a jugar?').fill(String(playerNames.length));
  await page.getByRole('button', { name: 'Preparar partida' }).click();
  await page.getByLabel('Número de rondas').fill(String(rounds));
  for (let i = 0; i < playerNames.length; i++) {
    await page
      .getByLabel(`Jugador ${String(i + 1).padStart(2, '0')}`, { exact: true })
      .fill(playerNames[i]);
  }
  await page.getByRole('button', { name: 'Empezar partida', exact: true }).click();
}

async function expectNoOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    width: innerWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.width + 1);
}

test('configuration validates counts, restores focus and renders names as literal text', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel('¿Cuántos vais a jugar?').fill('2');
  await page.getByRole('button', { name: 'Preparar partida' }).click();
  await expect(page.locator('#error-inicio')).toContainText('entre 3 y 15');
  await expect(page.getByLabel('¿Cuántos vais a jugar?')).toBeFocused();
  await page.getByLabel('¿Cuántos vais a jugar?').fill('15');
  await page.getByRole('button', { name: 'Preparar partida' }).click();
  await expect(page.locator('[name="inputNombre"]')).toHaveCount(15);
  await page.getByRole('button', { name: 'Volver', exact: true }).click();
  await expect(page.locator('#titulo-inicio')).toBeFocused();
  await page.getByRole('button', { name: 'Preparar partida' }).click();
  await page.getByLabel('Número de rondas').fill('1');
  await page.getByRole('button', { name: 'Empezar partida', exact: true }).click();
  await expect(page.locator('#error-jugadores')).toContainText('entre 2 y 10');
  await page.getByLabel('Número de rondas').fill('2');
  await page.getByRole('button', { name: 'Empezar partida', exact: true }).click();
  await expect(page.getByLabel('Jugador 01', { exact: true })).toBeFocused();
  const hostileName = '<img src=x onerror="window.injected=true">';
  for (let i = 1; i <= 15; i++) {
    await page
      .getByLabel(`Jugador ${String(i).padStart(2, '0')}`, { exact: true })
      .fill(i === 1 ? hostileName : `Persona ${i}`);
  }
  await expectNoOverflow(page);
  await page.getByRole('button', { name: 'Empezar partida', exact: true }).click();
  await expect(page.locator('#titulo-turno')).toContainText(hostileName);
  await expect(page.locator('#divContenido img')).toHaveCount(0);
  expect(await page.evaluate(() => Boolean(window.injected))).toBe(false);
  await page.getByRole('link', { name: 'Cartas contra la humanidad, inicio' }).click();
  await expect(page.getByRole('button', { name: 'Preparar partida' })).toBeVisible();
});

test('complete game through the UI: selection, privacy, anonymous vote, results and restart', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await setupGame(page);
  for (let round = 1; round <= 2; round++) {
    await expect(page.locator('#estado-partida')).toContainText(`Ronda ${round} / 2`);
    await page.getByRole('button', { name: 'Ver pregunta', exact: true }).click();
    await expect(page.locator('.question .card-copy')).not.toBeEmpty();
    await page.getByRole('button', { name: 'Que respondan los demás' }).click();
    const responses = [];
    for (let player = 0; player < 2; player++) {
      await page.getByRole('button', { name: 'Ver mis cartas', exact: true }).click();
      const cards = page.locator('.answer');
      const confirm = page.getByRole('button', { name: 'Jugar esta carta' });
      await expect(cards).toHaveCount(10);
      await expect(confirm).toBeDisabled();
      await cards.nth(0).click();
      await expect(cards.nth(0)).toHaveAttribute('aria-pressed', 'true');
      await cards.nth(1).click();
      await expect(cards.nth(0)).toHaveAttribute('aria-pressed', 'false');
      await expect(page.locator('.answer.selected')).toHaveCount(1);
      await expect(cards.nth(1).locator('.selection-badge')).toBeVisible();
      const selectedColor = await cards
        .nth(1)
        .evaluate((el) => getComputedStyle(el).backgroundColor);
      const normalColor = await cards.nth(0).evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(selectedColor).not.toBe(normalColor);
      const response = await cards.nth(1).locator('.card-copy').innerText();
      responses.push(response);
      await expect(page.locator('#seleccion-estado')).toContainText(response);
      await expect(cards).toHaveCount(10); // Selection alone has not submitted a response.
      await expect(confirm).toBeEnabled();
      await confirm.press('Enter');
      await expect(cards).toHaveCount(0);
      await expect(page.locator('#titulo-turno')).toBeFocused();
    }
    await page.getByRole('button', { name: 'Ver respuestas', exact: true }).click();
    const candidates = page.locator('.answer');
    await expect(candidates).toHaveCount(2);
    const combinations = await candidates.locator('.card-copy').allInnerTexts();
    for (const response of responses)
      expect(combinations.some((text) => text.includes(response))).toBe(true);
    for (const name of names) await expect(page.locator('#divContenido')).not.toContainText(name);
    const confirmWinner = page.getByRole('button', { name: 'Confirmar ganador' });
    await expect(confirmWinner).toBeDisabled();
    await candidates.first().click();
    await expect(candidates.first()).toHaveAttribute('aria-pressed', 'true');
    await confirmWinner.click();
    await expect(page.locator('#titulo-turno')).toContainText('se lleva la ronda');
    await expect(page.locator('.winning-card')).toBeVisible();
    await expect(page.locator('#estado-partida')).toContainText(`Ronda ${round} / 2`);
    await page
      .getByRole('button', { name: round === 2 ? 'Ver clasificación' : 'Siguiente ronda' })
      .click();
  }
  await expect(page.locator('#fin')).toBeVisible();
  await expect(page.locator('[data-screen]:visible')).toHaveCount(1);
  await expect(page.locator('.leaderboard-row')).toHaveCount(3);
  const scores = (await page.locator('.leaderboard-score').allInnerTexts()).map((text) =>
    Number.parseInt(text, 10),
  );
  expect(scores.reduce((sum, score) => sum + score, 0)).toBe(2);
  expect(scores).toEqual([...scores].sort((a, b) => b - a));
  await page.getByRole('button', { name: 'Otra ronda de malas ideas' }).click();
  await expect(page.getByRole('button', { name: 'Preparar partida' })).toBeVisible();
  await expect(page.locator('#fin')).toBeHidden();
  expect(errors).toEqual([]);
});

test('responsive screens handle long names, real card text and reduced motion', async ({
  page,
}) => {
  await setupGame(page, ['A'.repeat(80), 'B'.repeat(80), 'C'.repeat(80)]);
  await expectNoOverflow(page);
  await page.getByRole('button', { name: 'Ver pregunta', exact: true }).click();
  await page.getByRole('button', { name: 'Que respondan los demás' }).click();
  await page.getByRole('button', { name: 'Ver mis cartas', exact: true }).click();
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await expectNoOverflow(page);
    const clipped = await page
      .locator('.answer')
      .evaluateAll((cards) =>
        cards.some(
          (card) =>
            card.scrollHeight > card.clientHeight + 2 || card.scrollWidth > card.clientWidth + 2,
        ),
      );
    expect(clipped).toBe(false);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.answer').first()).toHaveCSS('transition-duration', '0s');
});
