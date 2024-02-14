const { Client, GatewayIntentBits, REST, ApplicationCommandOptionType } = require('discord.js');
const { Routes } = require('discord-api-types/v9');
const mongoose = require('mongoose');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

mongoose.connect('mongodb+srv://Winter:ELPEPE@cluster0.rdqfarm.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const dniSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  edad: { type: Number, required: true },
  sexo: { type: String, required: true },
  fechaNacimiento: { type: String, required: true },
  Nacionalidad: { type: String, required: true },
  dniNumber: { type: String, required: true, unique: true },
});

const DNIModel = mongoose.model('DNI', dniSchema);

const commands = [
  {
    name: 'creardni',
    description: 'Crea un DNI y guarda la información',
    options: [
      {
        name: 'nombre',
        type: ApplicationCommandOptionType.String,
        description: 'Nombre completo',
        required: true,
      },
      {
        name: 'edad',
        type: ApplicationCommandOptionType.Integer,
        description: 'Edad',
        required: true,
      },
    
      {
        name: 'sexo',
        type: ApplicationCommandOptionType.String,
        description: 'Sexo',
        required: true,
        choices: [
          { name: 'Masculino', value: 'masculino' },
          { name: 'Femenino', value: 'femenino' },
     ] },
     {
        name: 'nacionalidad',
        type: ApplicationCommandOptionType.String,
        description: 'Elige tu nacionalidad ej:estadounidense',
        required: true,
      },
      {
        name: 'fecha_nacimiento',
        type: ApplicationCommandOptionType.String,
        description: 'Fecha de nacimiento en formato YYYY-MM-DD',
        required: true,
      },

    ],
  },
  {
    name: 'verdni',
    description: 'Ver la información de un DNI',
    options: [
      {
        name: 'usuario',
        type: ApplicationCommandOptionType.User,
        description: 'Usuario del que quieres ver el DNI',
        required: true,
      },
    ],
  },
  {
    name: 'eliminardni',
    description: 'Eliminar información de un DNI (Solo para administradores)',
    options: [
      {
        name: 'usuario',
        type: ApplicationCommandOptionType.User,
        description: 'Usuario del que quieres eliminar el DNI',
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: '9' }).setToken('MTIwNjY2MzgzNDMyNTA5NDQzMA.GIN6tW.WqHel6hnJwhVlm7Ps4VFSKOY2VVbcGEvVIABlQ');

(async () => {
  try {
    console.log('Comandos iniciados...');

    await rest.put(
      Routes.applicationGuildCommands('1206663834325094430', '1187520607508766800'),
      { body: commands },
    );

    console.log('Comandos registrados correctamente.');
  } catch (error) {
    console.error(error);
  }
})();

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, user } = interaction;

  if (commandName === 'creardni') {
    try {
      // Verificar si el usuario ya tiene un DNI
      const existingDNI = await DNIModel.findOne({ userId: user.id });
      if (existingDNI) {
        return await interaction.reply('Ya tienes un DNI creado.');
      }

      // Obtener los valores de las opciones
      const nombre = interaction.options.getString('nombre');
      const edad = interaction.options.getInteger('edad');
      const sexo = interaction.options.getString('sexo');
      const fechaNacimiento = interaction.options.getString('fecha_nacimiento');
      const Nacionalidad = interaction.options.getString('nacionalidad');

      // Generar un número de DNI aleatorio de 8 dígitos
      const dniNumber = Math.floor(10000000 + Math.random() * 90000000).toString();

      // Crear un nuevo DNI en la base de datos
      const newDNI = new DNIModel({
        userId: user.id,
        nombre,
        edad,
        sexo,
        fechaNacimiento,
        Nacionalidad,
        dniNumber,
      });

      await newDNI.save();
      await interaction.reply('DNI creado y guardado correctamente.');
    } catch (error) {
      console.error(error);
      await interaction.reply('Hubo un error al intentar crear el DNI.');
    }
  } else if (commandName === 'verdni') {
    const targetUser = interaction.options.getUser('usuario') || user;

    try {
      // Obtener la información del DNI del usuario especificado
      const dniInfo = await DNIModel.findOne({ userId: targetUser.id });

      if (dniInfo) {
        // Formatear la respuesta con la información del DNI
        const response = `Información del DNI de ${targetUser.username}:\nNombre: ${dniInfo.nombre}\nEdad: ${dniInfo.edad}\nSexo: ${dniInfo.sexo}\n Nacionalidad:${dniInfo.Nacionalidad}\nFecha de Nacimiento: ${dniInfo.fechaNacimiento}\nNúmero de DNI: ${dniInfo.dniNumber}`;
        await interaction.reply(response);
      } else {
        await interaction.reply(`No se encontró información de DNI para ${targetUser.username}.`);
      }
    } catch (error) {
      console.error(error);
      await interaction.reply('Hubo un error al intentar obtener la información del DNI.');
    }
  } else if (commandName === 'eliminardni') {
    // Verificar si el usuario tiene permisos de administrador
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return await interaction.reply('Solo los administradores pueden usar este comando.');
    }

    // Obtener el usuario a eliminar del DNI
    const targetUser = interaction.options.getUser('usuario');

    try {
      // Eliminar la información del DNI del usuario especificado
      const deletedDNI = await DNIModel.findOneAndDelete({ userId: targetUser.id });

      if (deletedDNI) {
        await interaction.reply(`Información del DNI de ${targetUser.username} eliminada correctamente.`);
      } else {
        await interaction.reply(`No se encontró información de DNI para ${targetUser.username}.`);
      }
    } catch (error) {
      console.error(error);
      await interaction.reply('Hubo un error al intentar eliminar la información del DNI.');
    }
  }
});

client.login('MTIwNjY2MzgzNDMyNTA5NDQzMA.GIN6tW.WqHel6hnJwhVlm7Ps4VFSKOY2VVbcGEvVIABlQ');