const content = [
  ['Trailer', 'A first look at grids, form, and composition.', '01:59', '4196'],
  ['Introduction', 'An introduction to the season and its ideas.', '03:35', '106'],
  ['Composition I', 'The relationship between form and format.', '09:50', '63'],
  ['Composition II', 'Balance, hierarchy, and consistency.', '14:52', '110'],
  ['Composition III', 'Rhythm, contrast, and types of composition.', '13:01', '108'],
  ['Gestalt principles', 'Enclosure, connection, proximity, and closure.', '12:17', '104'],
  ['Leading lines', 'The psychology of grids and the theory of lines.', '22:46', '118'],
  ['Visual tension', 'Creating energy through deliberate placement.', '08:12', '123'],
  ['The grid', 'How grids work and how layouts take shape.', '10:19', '122'],
  ['Grid systems', 'Column, modular, and other grid systems.', '22:16', '119'],
  ['Trends & inspiration', 'Grid masters, references, and evolution.', '05:49', '121'],
  ['Books & sources', 'References and tools for further exploration.', '05:11', '114'],
  ['Grid mistakes', 'Common problems and how to avoid them.', '07:15', '666'],
  ['Secret techniques', 'Small decisions that make a stronger design.', '26:08', '667'],
  ['Deconstruction', 'Looking inside projects and their composition.', '34:51', '668'],
  ['Behind the scenes I', 'The process behind this interactive project.', '31:02', '669'],
  ['Behind the scenes II', 'From a working idea to a finished experience.', '34:03', '670'],
  ['Homework', 'Take these ideas into your own compositions.', '02:08', '671'],
];

export const chapters = content.map(([title, description, duration, image], index) => ({
  index, id: `chapter-${String(index).padStart(2, '0')}`,
  number: String(index).padStart(2, '0'), title, description, duration,
  image: `${import.meta.env.BASE_URL}pictures/image-${image}.webp`,
}));
