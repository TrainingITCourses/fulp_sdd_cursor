#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const DATA_FILE = path.join(process.cwd(), 'vacantes.json');

function loadVacantes() {
  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    console.error('Error: no se pudo leer vacantes.json');
    process.exit(1);
  }
}

function saveVacantes(vacantes) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(vacantes, null, 2), 'utf8');
}

function registrar(titulo, descripcion) {
  const vacantes = loadVacantes();
  vacantes.push({
    id: Date.now().toString(36),
    titulo,
    descripcion: descripcion || '',
    fecha: new Date().toISOString(),
  });
  saveVacantes(vacantes);
  console.log(`Vacante "${titulo}" registrada correctamente.`);
}

function listar() {
  const vacantes = loadVacantes();
  if (vacantes.length === 0) {
    console.log('No hay puestos vacantes registrados.');
    return;
  }
  console.log(`\nPuestos vacantes (${vacantes.length}):\n`);
  vacantes.forEach((v, i) => {
    console.log(`${i + 1}. ${v.titulo}`);
    if (v.descripcion) {
      console.log(`   ${v.descripcion}`);
    }
    console.log(`   Alta: ${v.fecha}`);
    console.log('');
  });
}

function preguntar(rl, texto) {
  return new Promise((resolve) => {
    rl.question(texto, (respuesta) => resolve(String(respuesta || '').trim()));
  });
}

async function altaInteractiva() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const titulo = await preguntar(rl, 'Título del puesto: ');
    if (!titulo) {
      console.error('Error: el título es obligatorio.');
      process.exitCode = 1;
      return;
    }
    const descripcion = await preguntar(rl, 'Descripción (opcional): ');
    registrar(titulo, descripcion);
  } finally {
    rl.close();
  }
}

async function alta(args) {
  const titulo = args[0];
  const descripcion = args[1] || '';

  if (titulo) {
    registrar(titulo, descripcion);
    return;
  }

  if (!process.stdin.isTTY) {
    console.error('Error: el título es obligatorio. Uso: node vacantes.js alta "<titulo>" ["<descripcion>"]');
    process.exitCode = 1;
    return;
  }

  await altaInteractiva();
}

function uso() {
  console.log(`Uso:
  node vacantes.js alta ["<titulo>" ["<descripcion>"]]
  node vacantes.js listado`);
}

async function main() {
  const comando = (process.argv[2] || '').toLowerCase();
  const args = process.argv.slice(3);

  switch (comando) {
    case 'alta':
      await alta(args);
      break;
    case 'listado':
    case 'listar':
      listar();
      break;
    default:
      uso();
      process.exitCode = comando ? 1 : 0;
  }
}

main();
