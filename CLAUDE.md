# CLAUDE.md - English Billiards System Rules

## Hardware Specifications (Equipment)
- **[span_0](start_span)Table Dimensions**: Playing area must measure 11 ft 8½ in x 5 ft 10 in (3569 mm x 1778 mm) with tolerance of +/- ½ in (13 mm)[span_0](end_span).
- **[span_1](start_span)Table Height**: Floor to top of cushion rail must be 2 ft 10 in (864 mm) +/- ½ in (13 mm)[span_1](end_span).
- **Baulk Configuration**: Baulk-line drawn 29 in (737 mm) from Bottom Cushion face; [span_2](start_span)"D" radius is 11½ in (292 mm)[span_2](end_span).
- **[span_3](start_span)Ball Standards**: Diameter 52.5 mm (+/- 0.05 mm)[span_3](end_span). [span_4](start_span)Weight tolerance max 0.5g between heaviest and lightest[span_4](end_span).
- **[span_5](start_span)Cue Specs**: Minimum length 3 ft (914 mm); must maintain traditional tapered shape[span_5](end_span).

## Scoring Engine (Logic)
- **Point Values**:
  - [span_6](start_span)Pot Red / In-off Red: 3 points[span_6](end_span).
  - [span_7](start_span)Pot White/Yellow / In-off White/Yellow: 2 points[span_7](end_span).
  - [span_8](start_span)Cannon: 2 points[span_8](end_span).
- **[span_9](start_span)Combination Scoring**: Sum all hazards and cannons executed in a stroke[span_9](end_span).
- **In-off + Cannon Logic**:
  - [span_10](start_span)Score 3 (plus cannon) if Red contacted first[span_10](end_span).
  - [span_11](start_span)Score 2 (plus cannon) if opponent ball contacted first or simultaneous contact[span_11](end_span).

## System Constraints & Limitations
- **[span_12](start_span)Cannon Limit**: Maximum 75 consecutive cannons allowed; referee must call "SEVENTY CANNONS" at 70[span_12](end_span).
- **[span_13](start_span)Hazard Limit**: Maximum 15 consecutive hazards allowed; referee must call "TEN HAZARDS" at 10[span_13](end_span).
- **[span_14](start_span)Baulk-line Loop Break**: Cue-ball must cross Baulk-line between 80-100 points of a break[span_14](end_span).
  - [span_15](start_span)Must cross *into* Baulk (against nap)[span_15](end_span).
  - [span_16](start_span)Failure to cross between 80-100 triggers a foul[span_16](end_span).

## Error Handling (Fouls & Penalties)
- **[span_17](start_span)[span_18](start_span)Standard Penalty**: 2 points added to opponent score for all fouls/misses[span_17](end_span)[span_18](end_span).
- **Foul Triggers**:
  - [span_19](start_span)Striking ball other than cue-ball[span_19](end_span).
  - [span_20](start_span)Striking cue-ball more than once (double hit)[span_20](end_span).
  - [span_21](start_span)Push stroke (contact not momentary)[span_21](end_span).
  - [span_22](start_span)Jump shot (cue-ball jumping over object ball)[span_22](end_span).
  - [span_23](start_span)Forcing ball off table[span_23](end_span).
  - [span_24](start_span)Playing while balls are moving[span_24](end_span).
  - [span_25](start_span)No foot on floor[span_25](end_span).
- **[span_26](start_span)Foul Recovery Options**: Next player plays from rest OR from in-hand (Red on Spot, Opponent on Centre Spot)[span_26](end_span).

## State Management (Spotting)
- **[span_27](start_span)Red Ball Spotting Priority**: Spot -> Pyramid Spot -> Centre Spot[span_27](end_span).
- **[span_28](start_span)Consecutive Red Spot Logic**: If Red potted twice consecutively from Spot/Pyramid (no other score), force move to Centre Spot[span_28](end_span).
- **Touching Ball Handler**:
  - [span_29](start_span)Red -> Spot[span_29](end_span).
  - [span_30](start_span)Non-striker -> Centre Spot[span_30](end_span).
  - [span_31](start_span)Striker -> Play from In-hand[span_31](end_span).