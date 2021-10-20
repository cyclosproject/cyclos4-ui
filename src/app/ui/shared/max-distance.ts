import { GeographicalCoordinate } from 'app/api/models';

/**
 * Represents the maximum distance for a search
 */
export interface MaxDistance extends GeographicalCoordinate {
  maxDistance: number;
  name: string;
}
