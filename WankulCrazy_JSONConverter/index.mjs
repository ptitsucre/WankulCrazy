import fs, {promises as fsPromises} from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import sharp from 'sharp';

function getSeasonEnum(season) {
    switch (season) {
        case 'SO1':
        case 'S01':
            return 0;
        case 'SO2':
        case 'S02':
            return 1;
        case 'SO3':
        case 'S03':
            return 2;
        case 'HS':
            return 3;
        default:
            return -1;
    }
}

function getRarityEnum(rarity) {
    switch (rarity) {
        case 'C':
            return 0;
        case 'UC':
            return 1;
        case 'R':
            return 2;
        case 'UR1':
            return 3;
        case 'UR2':
            return 4;
        case 'L-B':
            return 5;
        case 'L-A':
            return 6;
        case 'L-O':
            return 7;
        case 'PGW-23':
            return 8;
        case 'NOEL-23':
            return 9;
        case 'SP-CIV':
            return 10;
        case 'SP-LEG':
            return 11;
        case 'E-D':
            return 12;
        case 'SP-POP':
            return 13;
        case 'G-P':
            return 14;
        case 'SP-TV':
            return 15;
        case 'SP-JV':
            return 16;
        case 'E-G':
            return 17;
        case 'SP-CAR':
            return 18;
        case 'T-OR':
            return 19;
        default:
            return -1;
    }
}

async function resizeImage(imageBuffer) {
    const resizedBuffer = await sharp(imageBuffer)
        .resize(637, 891) // Resize to 637x891 pixels
        .toBuffer();

    return sharp({
        create: {
            width: 1024,
            height: 1024,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
        }
    })
    .composite([{ input: resizedBuffer, gravity: 'center' }]) // Center the resized image
    .png() // Convert to PNG format
    .toBuffer();
}

async function main() {
    const input = await fsPromises.readFile('wankul_cards.json', 'utf8');
    const parsed = JSON.parse(input);
    const cards = parsed.cards;

    const formatedCards = {
        wankuls : [],
        terrains : [],
    };
    for (const card of cards) {
        await new Promise(resolve => setTimeout(resolve, 50));
        const response = await fetch(card.image);
        const buffer = await response.arrayBuffer();
        const resizedBuffer = await resizeImage(buffer);
        const imagePath = path.join('./textures', card.number + card.title.replaceAll('/', '') + '.png');
        await fsPromises.mkdir(path.dirname(imagePath), { recursive: true });
        await fsPromises.writeFile(imagePath, resizedBuffer);
        if (card.rarity.id == 1) {
            const formatedCard = {
                Number: card.number,
                Title: card.title,
                Artist: card.artist.name,
                Season: getSeasonEnum(card.season.number),
                CardType: 0,
                WinningEffect: card.tWinningEffect,
                LosingEffect: card.tLosingEffect,
                SpecialEffect: card.tSpecialEffect,
                TexturePath: imagePath,
            };
            formatedCards.terrains.push(formatedCard);
        } else {
            const formatedCard = {
                Number: card.number,
                Title: card.title,
                Artist: card.artist.name,
                Season: getSeasonEnum(card.season.number),
                CardType: 1,
                Effigy: card.effigy.name,
                Force: card.force != null && card.force.length > 0 ? parseInt(card.force) : 0,
                Cost: card.cost != null && card.cost.length > 0 ? parseInt(card.cost) : 0,
                Rules: card.rules,
                Combo: card.combo,
                Quote: card.quote,
                Rarity: getRarityEnum(card.rarity.accronym),
                TexturePath: imagePath,
            };
            formatedCards.wankuls.push(formatedCard);
        }

    }


    await fsPromises.writeFile('formated_wankul_cards.json', JSON.stringify(formatedCards, null, 4));
}

main();