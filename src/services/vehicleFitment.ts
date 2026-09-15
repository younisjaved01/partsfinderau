import type { Part, VehicleQuery, FitmentCheck, Vehicle } from '@/types';
import { vehicles, vehicleLabel } from '@/data/vehicles';

/**
 * VEHICLE FITMENT SERVICE (§8)
 * Never claims compatibility without a confidence and reasons.
 */

function resolveVehicle(vq: VehicleQuery): Vehicle | undefined {
  return vehicles.find(
    (v) =>
      (!vq.make || v.make.toLowerCase() === vq.make.toLowerCase()) &&
      (!vq.model || v.model.toLowerCase() === vq.model.toLowerCase()) &&
      (!vq.series || (v.series ?? '').toLowerCase().includes(vq.series.toLowerCase())),
  );
}

export function checkFitment(part: Part, vq: VehicleQuery): FitmentCheck {
  const vehicle = resolveVehicle(vq);
  if (!vehicle) {
    return {
      verdict: 'unknown',
      confidence: 0,
      reasons: ['Select a make and model to verify fitment'],
    };
  }

  const fitment = part.fitments.find((f) => f.vehicleId === vehicle.id);
  const reasons: string[] = [];

  if (!fitment) {
    return {
      verdict: 'no-fit',
      confidence: 0.9,
      reasons: [`This part is not catalogued for the ${vehicleLabel(vehicle)}`],
    };
  }

  reasons.push(`Catalogued for ${vehicleLabel(vehicle)} (${fitment.yearFrom}–${fitment.yearTo})`);
  let confidence = fitment.confidence;
  let verdict: FitmentCheck['verdict'] = 'fits';

  // Year check.
  if (vq.year) {
    if (vq.year < fitment.yearFrom || vq.year > fitment.yearTo) {
      verdict = 'possible';
      confidence = Math.min(confidence, 0.55);
      reasons.push(`⚠️ ${vq.year} is outside the catalogued range — verify before ordering`);
    } else {
      reasons.push(`Year ${vq.year} within range`);
    }
  }

  // Engine check.
  if (vq.engine && fitment.engine && fitment.engine !== vq.engine) {
    verdict = verdict === 'fits' ? 'possible' : verdict;
    confidence = Math.min(confidence, 0.6);
    reasons.push(`⚠️ Catalogued for ${fitment.engine}, you selected ${vq.engine}`);
  } else if (vq.engine && fitment.engine) {
    reasons.push(`Engine ${vq.engine} matches`);
  }

  if (fitment.note) reasons.push(fitment.note);

  return { verdict, confidence, reasons };
}
