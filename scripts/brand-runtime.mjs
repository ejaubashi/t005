// Apply the local identity at build time; keep the reference snapshot intact.
export function applyIdentity(source) {
  const letters = [
    ['S', 0, [[46, 0, 227, 92], [0, 43, 89, 69], [89, 112, 95, 49], [184, 161, 89, 69], [0, 181, 227, 92]]],
    ['H', 301, [[0, 0, 92, 273], [181, 0, 92, 273], [92, 92, 89, 89]]],
    ['I', 602, [[0, 0, 92, 273]]],
    ['F', 722, [[0, 0, 92, 273], [92, 0, 181, 92], [92, 112, 138, 69]]],
    ['T', 1023, [[0, 0, 273, 92], [92, 92, 89, 181]]],
  ];
  const modules = letters.flatMap(([letter, offset, rectangles]) =>
    rectangles.map(([x, y, w, h], index) => ({
      id: `shift-${letter}-${index}`, letter, x: offset + x, y, w, h,
    })),
  );
  const start = source.indexOf('var Lu=');
  const end = source.indexOf(';function Bu', start);
  if (start < 0 || end < 0) throw new Error('Reference wordmark definition changed.');
  source = source.slice(0, start)
    + `var Lu={width:1296,height:273},Ru=${JSON.stringify([... 'SHIFT'])},zu=${JSON.stringify(modules)}`
    + source.slice(end);

  for (const [from, to, count] of [
    ['n(`Grids`,Ud)', 'n(`SHIFT`,Ud)', 1],
    ['n(`S03`,Wd)', 'n(`001`,Wd)', 1],
    ['measureText(`GRIDS`)', 'measureText(`SHIFT`)', 2],
    ['eg=`GRIDS`', 'eg=`FORMS`', 1],
  ]) {
    if (source.split(from).length - 1 !== count) {
      throw new Error(`Reference identity anchor changed: ${from}`);
    }
    source = source.replaceAll(from, to);
  }
  return source + '\nexport function jumpTo(y) { if (mc.lenis) mc.lenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y); }\n';
}
