export interface KnowledgeQuestion {
  q: string
  options: string[]
  answerIndex: number
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface TopicKnowledge {
  summary: string
  explainer: string
  keyPoints: string[]
  definitions: { term: string; meaning: string }[]
  mnemonics: string[]
  mistakes: string[]
  questions: KnowledgeQuestion[]
}

const K: Record<string, TopicKnowledge> = {
  'laws of motion': {
    summary:
      "Newton's laws of motion explain how forces change the motion of objects, from a book resting on a table to a rocket lifting off. They connect force, mass and acceleration.",
    explainer:
      "Start with inertia: an object keeps doing what it is doing unless a net external force acts. When a net force does act, acceleration is proportional to force and inversely proportional to mass (F = ma). Every action also has an equal and opposite reaction on a different body.",
    keyPoints: [
      'First law: a body stays at rest or in uniform motion unless acted on by a net external force.',
      'Second law: F = ma, so acceleration points in the direction of the net force.',
      'Third law: every action has an equal and opposite reaction on another body.',
      'Friction opposes relative motion and can be static or kinetic.',
    ],
    definitions: [
      { term: 'Inertia', meaning: 'The tendency of a body to resist a change in its state of motion.' },
      { term: 'Momentum', meaning: 'The product of mass and velocity, p = mv; a vector quantity.' },
      { term: 'Impulse', meaning: 'Force multiplied by the time it acts; it equals the change in momentum.' },
    ],
    mnemonics: ['IFA: Inertia → Force → Action-reaction (the order of Newton’s three laws).'],
    mistakes: [
      'Action and reaction act on the same body — they actually act on two different bodies.',
      'Confusing mass (kg) with weight (N); weight is mg.',
      'Assuming a moving object always has a force acting on it.',
    ],
    questions: [
      {
        q: "Newton's first law is also known as the law of:",
        options: ['Inertia', 'Acceleration', 'Gravitation', 'Momentum'],
        answerIndex: 0,
        explanation: 'An object resists changes to its motion, which is the definition of inertia.',
        difficulty: 'easy',
      },
      {
        q: 'A net force of 12 N acts on a 3 kg body. Its acceleration is:',
        options: ['36 m/s²', '4 m/s²', '0.25 m/s²', '9 m/s²'],
        answerIndex: 1,
        explanation: 'From F = ma, a = F/m = 12/3 = 4 m/s².',
        difficulty: 'easy',
      },
      {
        q: 'An action–reaction pair always acts on:',
        options: ['The same body', 'Two different bodies', 'Only moving bodies', 'Only bodies at rest'],
        answerIndex: 1,
        explanation: 'Newton’s third law pairs act on two different bodies, which is why they never cancel out.',
        difficulty: 'medium',
      },
    ],
  },
  'work energy power': {
    summary:
      'Work measures energy transferred by a force. The work–energy theorem links net work to the change in kinetic energy, while power measures how fast work is done.',
    explainer:
      'Only the component of force along displacement does work: W = Fd cos θ. For a constant net force, net work equals the change in kinetic energy. Conservative forces like gravity store potential energy; friction is non-conservative and dissipates energy as heat.',
    keyPoints: [
      'W = F·d·cos θ; work can be positive, negative or zero.',
      'Work–energy theorem: W_net = ΔKE = ½mv² − ½mu².',
      'Potential energy arises for conservative forces: U = mgh near the Earth.',
      'Power P = W/t = F·v; its SI unit is the watt.',
    ],
    definitions: [
      { term: 'Kinetic energy', meaning: 'Energy of motion, KE = ½mv².' },
      { term: 'Conservative force', meaning: 'A force whose work is path-independent and can be stored as potential energy.' },
      { term: 'Watt', meaning: 'One joule of work done per second.' },
    ],
    mnemonics: ['“Work equals force dot distance” — the dot reminds you to use cos θ.'],
    mistakes: [
      'Forgetting cos θ when force is at an angle to displacement.',
      'Assuming zero work always means zero force — a centripetal force does zero work while acting.',
    ],
    questions: [
      {
        q: 'Work done by a force perpendicular to displacement is:',
        options: ['Maximum', 'Zero', 'Negative', 'Equal to force'],
        answerIndex: 1,
        explanation: 'cos 90° = 0, so W = Fd cos 90° = 0.',
        difficulty: 'easy',
      },
      {
        q: 'The SI unit of power is:',
        options: ['Joule', 'Newton', 'Watt', 'Pascal'],
        answerIndex: 2,
        explanation: 'Power = work/time, so one joule per second is one watt.',
        difficulty: 'easy',
      },
    ],
  },
  'rotational motion': {
    summary:
      'Rotational motion mirrors linear motion: torque plays the role of force, moment of inertia the role of mass, and angular momentum the role of linear momentum.',
    explainer:
      'A torque about an axis is τ = rF sin θ and changes angular momentum. Moment of inertia depends on how mass is distributed around the axis, so the same object resists rotation differently about different axes.',
    keyPoints: [
      'τ = Iα is the rotational form of F = ma.',
      'Angular momentum L = Iω is conserved when net torque is zero.',
      'Moment of inertia depends on mass distribution, not just total mass.',
      'Rolling combines translation and rotation: KE = ½mv² + ½Iω².',
    ],
    definitions: [
      { term: 'Torque', meaning: 'The turning effect of a force about an axis, τ = rF sin θ.' },
      { term: 'Angular momentum', meaning: 'L = Iω, conserved when external torque is zero.' },
      { term: 'Radius of gyration', meaning: 'The distance at which the whole mass could be concentrated for the same moment of inertia.' },
    ],
    mnemonics: ['“Torque = I alpha” — TIA, the rotational twin of F = ma.'],
    mistakes: ['Assuming angular momentum is always conserved — it needs zero net external torque.'],
    questions: [
      {
        q: 'The rotational analogue of force is:',
        options: ['Torque', 'Moment of inertia', 'Angular velocity', 'Angular momentum'],
        answerIndex: 0,
        explanation: 'Torque changes rotational motion just as force changes linear motion.',
        difficulty: 'easy',
      },
    ],
  },
  thermodynamics: {
    summary:
      'Thermodynamics studies energy transfers as heat and work. The first law is energy conservation for a system; the second law sets the direction of spontaneous change and introduces entropy.',
    explainer:
      'For a system, ΔU = Q − W, where Q is heat added to the system and W is work done by it. Isothermal processes keep temperature constant, adiabatic processes exchange no heat, and entropy measures unavailable energy dispersal.',
    keyPoints: [
      'First law: ΔU = Q − W (energy is conserved).',
      'Isothermal: T constant; adiabatic: Q = 0.',
      'Second law: entropy of an isolated system never decreases.',
      'Efficiency of a heat engine η = 1 − T_c/T_h for a Carnot engine.',
    ],
    definitions: [
      { term: 'Internal energy', meaning: 'The total kinetic and potential energy of the particles of a system.' },
      { term: 'Entropy', meaning: 'A measure of disorder or energy dispersal in a system.' },
      { term: 'Adiabatic process', meaning: 'A process with no heat exchange between system and surroundings.' },
    ],
    mnemonics: ['“D U = Q minus W” — heat in, work out.'],
    mistakes: [
      'Using Celsius directly in gas-law and efficiency formulas instead of kelvin.',
      'Mixing up work done by the system and work done on the system.',
    ],
    questions: [
      {
        q: 'In an adiabatic process:',
        options: ['Q = 0', 'W = 0', 'ΔU = 0', 'T is constant'],
        answerIndex: 0,
        explanation: 'Adiabatic means no heat is exchanged with the surroundings.',
        difficulty: 'easy',
      },
    ],
  },
  waves: {
    summary:
      'Waves transfer energy without transferring matter. Their speed is the product of frequency and wavelength, and sound waves are longitudinal pressure waves.',
    explainer:
      'For a wave, v = fλ. Frequency is set by the source, wave speed by the medium, and wavelength adjusts accordingly. In a closed pipe, only odd harmonics are present; in an open pipe, all harmonics appear.',
    keyPoints: [
      'v = fλ links speed, frequency and wavelength.',
      'Transverse waves vibrate perpendicular to propagation; longitudinal waves vibrate along it.',
      'Sound needs a medium; light does not.',
      'Beats occur at the difference of two close frequencies.',
    ],
    definitions: [
      { term: 'Wavelength', meaning: 'The distance between two consecutive points in phase.' },
      { term: 'Amplitude', meaning: 'The maximum displacement from equilibrium.' },
      { term: 'Beat frequency', meaning: 'The absolute difference between two interfering frequencies.' },
    ],
    mnemonics: ['“Very Fine Lamb” — Velocity = frequency × lambda.'],
    mistakes: ['Thinking frequency changes when a wave enters a new medium; it is wavelength and speed that change.'],
    questions: [
      {
        q: 'A wave has frequency 50 Hz and wavelength 4 m. Its speed is:',
        options: ['12.5 m/s', '54 m/s', '200 m/s', '0.08 m/s'],
        answerIndex: 2,
        explanation: 'v = fλ = 50 × 4 = 200 m/s.',
        difficulty: 'easy',
      },
    ],
  },
  electrostatics: {
    summary:
      'Electrostatics deals with charges at rest. Coulomb’s law describes the force between charges, while electric field and potential describe the space around them.',
    explainer:
      'The force between two point charges is F = kq₁q₂/r² along the line joining them. Electric field lines start on positive charges and end on negative ones. The potential difference between two points is the work per unit charge to move between them.',
    keyPoints: [
      'Coulomb’s law: F = (1/4πε₀)q₁q₂/r².',
      'Electric field E points from positive to negative charge.',
      'Potential is a scalar; field is a vector.',
      'Capacitance C = Q/V, and capacitors in parallel add.',
    ],
    definitions: [
      { term: 'Electric field', meaning: 'Force per unit positive test charge at a point.' },
      { term: 'Electric potential', meaning: 'Work done per unit charge in bringing a charge from infinity to that point.' },
      { term: 'Capacitance', meaning: 'The ability to store charge per unit potential difference.' },
    ],
    mnemonics: ['“Like repels, unlike attracts” — the simplest charge rule.'],
    mistakes: ['Forgetting that potential is scalar while field is a vector.', 'Using the distance between surfaces rather than centres of charge.'],
    questions: [
      {
        q: 'The electric field inside a conductor in electrostatic equilibrium is:',
        options: ['Maximum', 'Zero', 'Uniform but non-zero', 'Infinite'],
        answerIndex: 1,
        explanation: 'Charges rearrange on the surface until the internal field cancels to zero.',
        difficulty: 'medium',
      },
    ],
  },
  'current electricity': {
    summary:
      'Current electricity is the flow of charge through conductors. Ohm’s law, resistance combinations and Kirchhoff’s rules let us analyse circuits.',
    explainer:
      'Current I = Q/t is the rate of charge flow, driven by potential difference. For an ohmic conductor, V = IR. Resistors in series add directly; in parallel their reciprocals add. Kirchhoff’s junction rule conserves charge, and his loop rule conserves energy.',
    keyPoints: [
      'Ohm’s law: V = IR for ohmic conductors at constant temperature.',
      'Series: R = R₁ + R₂ + …; Parallel: 1/R = 1/R₁ + 1/R₂ + …',
      'Kirchhoff’s junction rule: current in equals current out.',
      'Power dissipated P = VI = I²R = V²/R.',
    ],
    definitions: [
      { term: 'Resistance', meaning: 'Opposition to current flow, measured in ohms.' },
      { term: 'EMF', meaning: 'The maximum potential difference a source can provide.' },
      { term: 'Drift velocity', meaning: 'The average velocity of charge carriers along a conductor.' },
    ],
    mnemonics: ['“Vir” — V = IR, the foundation of circuit calculations.'],
    mistakes: ['Adding parallel resistances directly.', 'Ignoring internal resistance of a cell.'],
    questions: [
      {
        q: 'Two 6 Ω resistors in parallel give an equivalent resistance of:',
        options: ['12 Ω', '6 Ω', '3 Ω', '1.5 Ω'],
        answerIndex: 2,
        explanation: '1/R = 1/6 + 1/6 = 1/3, so R = 3 Ω.',
        difficulty: 'easy',
      },
      {
        q: 'Power dissipated by a resistor is:',
        options: ['VI', 'I²R', 'V²/R', 'All of these'],
        answerIndex: 3,
        explanation: 'All three are equivalent forms of electrical power using Ohm’s law.',
        difficulty: 'medium',
      },
    ],
  },
  optics: {
    summary:
      'Optics explains how light reflects, refracts and forms images. Snell’s law and the lens/mirror formulas quantify image position and size.',
    explainer:
      'Light bends toward the normal when entering a denser medium. The lens formula 1/f = 1/v − 1/u and magnification m = v/u describe image formation. Total internal reflection happens above the critical angle.',
    keyPoints: [
      'Snell’s law: n₁ sin θ₁ = n₂ sin θ₂.',
      'Lens formula: 1/f = 1/v − 1/u; magnification m = v/u.',
      'Total internal reflection occurs when light goes from dense to rare above the critical angle.',
      'A convex lens converges light; a concave lens diverges it.',
    ],
    definitions: [
      { term: 'Refractive index', meaning: 'The ratio of light speed in vacuum to its speed in a medium.' },
      { term: 'Focal length', meaning: 'Distance from a lens or mirror to its principal focus.' },
      { term: 'Critical angle', meaning: 'The angle of incidence for which the refracted ray grazes the surface.' },
    ],
    mnemonics: ['“Dense to rare, bends away from the normal.”'],
    mistakes: ['Using the wrong sign convention for u and v.', 'Assuming a real image is always formed by a convex lens.'],
    questions: [
      {
        q: 'Light travelling from water to air bends:',
        options: ['Towards the normal', 'Away from the normal', 'Not at all', 'Backwards'],
        answerIndex: 1,
        explanation: 'It moves into a rarer medium and speeds up, so it bends away from the normal.',
        difficulty: 'easy',
      },
    ],
  },
  'chemical bonding': {
    summary:
      'Chemical bonding explains why atoms combine: ionic bonds transfer electrons, covalent bonds share them, and metallic bonds delocalise them. Bond type controls melting point, conductivity and solubility.',
    explainer:
      'Ionic compounds form between metals and non-metals and conduct when molten or dissolved. Covalent molecules share electron pairs and are usually poor conductors. VSEPR predicts shapes by minimising electron-pair repulsion; hybridisation explains bond angles and bonding in carbon.',
    keyPoints: [
      'Ionic bonds: electron transfer, high melting points, conduct when molten or aqueous.',
      'Covalent bonds: shared electron pairs; polarity depends on electronegativity difference.',
      'VSEPR: electron pairs repel and adopt the arrangement that minimises repulsion.',
      'Hydrogen bonding explains water’s unusually high boiling point.',
    ],
    definitions: [
      { term: 'Electronegativity', meaning: 'The tendency of an atom to attract a shared pair of electrons.' },
      { term: 'Hybridisation', meaning: 'Mixing of atomic orbitals to form new equivalent bonding orbitals.' },
      { term: 'Bond order', meaning: 'The number of electron pairs shared between two atoms.' },
    ],
    mnemonics: ['VSEPR = “Valence Shell Electron Pair Repulsion” — pairs push apart.'],
    mistakes: [
      'Saying ionic compounds conduct electricity in the solid state — ions are fixed in the lattice.',
      'Confusing bond polarity with molecular polarity; geometry can cancel bond dipoles.',
    ],
    questions: [
      {
        q: 'The shape of a methane (CH₄) molecule is:',
        options: ['Square planar', 'Tetrahedral', 'Trigonal planar', 'Linear'],
        answerIndex: 1,
        explanation: 'Four bonding pairs around carbon adopt a tetrahedral arrangement with sp³ hybridisation.',
        difficulty: 'easy',
      },
      {
        q: 'Ionic compounds generally conduct electricity when:',
        options: ['Solid', 'Molten or dissolved', 'Frozen', 'Never'],
        answerIndex: 1,
        explanation: 'Melting or dissolving frees the ions to move and carry current.',
        difficulty: 'medium',
      },
      {
        q: 'A bond formed by sharing one electron pair is called:',
        options: ['Single covalent bond', 'Ionic bond', 'Metallic bond', 'Hydrogen bond'],
        answerIndex: 0,
        explanation: 'One shared pair corresponds to a single covalent bond.',
        difficulty: 'easy',
      },
    ],
  },
  equilibrium: {
    summary:
      'Chemical equilibrium is dynamic: forward and reverse reactions proceed at equal rates, so concentrations stay constant. Le Chatelier’s principle predicts how a system responds to disturbance.',
    explainer:
      'At equilibrium the reaction quotient Q equals the equilibrium constant K. Changing concentration, pressure or temperature shifts the position of equilibrium. Catalysts speed up both directions equally and do not change K.',
    keyPoints: [
      'Equilibrium is dynamic, not static — both reactions continue.',
      'K depends only on temperature for a given reaction.',
      'Le Chatelier: the system shifts to oppose the applied change.',
      'Catalysts do not shift equilibrium; they only help it arrive sooner.',
    ],
    definitions: [
      { term: 'Equilibrium constant', meaning: 'The ratio of product to reactant activities at equilibrium.' },
      { term: 'Le Chatelier’s principle', meaning: 'A system at equilibrium shifts to counteract a disturbance.' },
      { term: 'Reaction quotient', meaning: 'The same ratio as K but at a non-equilibrium moment.' },
    ],
    mnemonics: ['“Add pressure → shift to fewer gas molecules.”'],
    mistakes: ['Believing equilibrium means equal concentrations.', 'Thinking a catalyst increases yield.'],
    questions: [
      {
        q: 'At equilibrium, the forward and reverse reaction rates are:',
        options: ['Equal', 'Zero', 'Maximum', 'Undefined'],
        answerIndex: 0,
        explanation: 'Equal rates keep concentrations constant while both reactions continue.',
        difficulty: 'easy',
      },
    ],
  },
  'organic chemistry': {
    summary:
      'Organic chemistry studies carbon compounds. Functional groups determine reactivity, while isomerism explains why one molecular formula can have multiple structures.',
    explainer:
      'Carbon forms four covalent bonds and can catenate. Functional groups such as -OH, -COOH and -CHO define families like alcohols, acids and aldehydes. IUPAC naming identifies the longest chain and the lowest locants for substituents.',
    keyPoints: [
      'Carbon shows tetravalency and catenation.',
      'Functional groups control physical and chemical properties.',
      'Isomers share a molecular formula but differ in structure.',
      'Homologous series differ by one CH₂ unit.',
    ],
    definitions: [
      { term: 'Functional group', meaning: 'An atom or group that defines the characteristic reactions of a compound.' },
      { term: 'Isomer', meaning: 'Compounds with the same molecular formula but different arrangements.' },
      { term: 'Catenation', meaning: 'The ability of carbon atoms to bond with each other in chains.' },
    ],
    mnemonics: ['“Alcohols OH, aldehydes CHO, acids COOH” — functional group families.'],
    mistakes: ['Confusing aldehyde (-CHO) and ketone (-CO-) structures.', 'Ignoring the lowest-number rule when numbering chains.'],
    questions: [
      {
        q: 'The functional group -COOH belongs to:',
        options: ['Alcohols', 'Aldehydes', 'Carboxylic acids', 'Esters'],
        answerIndex: 2,
        explanation: '-COOH is the carboxyl group, characteristic of carboxylic acids.',
        difficulty: 'easy',
      },
    ],
  },
  electrochemistry: {
    summary:
      'Electrochemistry connects chemical reactions and electricity. Galvanic cells convert chemical energy into electrical energy; electrolytic cells use electricity to drive non-spontaneous reactions.',
    explainer:
      'Oxidation loses electrons at the anode; reduction gains them at the cathode. Cell potential E°cell = E°cathode − E°anode. The Nernst equation adjusts potential for non-standard concentrations.',
    keyPoints: [
      'Oxidation occurs at the anode, reduction at the cathode.',
      'E°cell = E°cathode − E°anode; a positive E°cell means a spontaneous reaction.',
      'The Nernst equation accounts for concentration effects.',
      'In electrolysis, the external supply forces a non-spontaneous reaction.',
    ],
    definitions: [
      { term: 'Anode', meaning: 'The electrode where oxidation occurs.' },
      { term: 'Cathode', meaning: 'The electrode where reduction occurs.' },
      { term: 'Nernst equation', meaning: 'A relation giving cell potential at non-standard conditions.' },
    ],
    mnemonics: ['“AN OX, RED CAT” — Anode oxidation, reduction cathode.'],
    mistakes: ['Reversing anode and cathode signs in E°cell.', 'Assuming electrons flow through the salt bridge.'],
    questions: [
      {
        q: 'Oxidation takes place at the:',
        options: ['Anode', 'Cathode', 'Salt bridge', 'Voltmeter'],
        answerIndex: 0,
        explanation: 'Oxidation is loss of electrons, which happens at the anode.',
        difficulty: 'easy',
      },
    ],
  },
  'coordination compounds': {
    summary:
      'Coordination compounds contain a central metal ion bonded to ligands. Coordination number, geometry and ligand field strength shape their colour, magnetism and stability.',
    explainer:
      'Ligands donate electron pairs to the metal. The coordination number is the number of donor atoms. Crystal field theory explains colour and magnetism by splitting metal d-orbitals differently. Strong-field ligands cause larger splitting.',
    keyPoints: [
      'Coordination number = number of donor atoms attached to the metal.',
      'Ligands can be monodentate, bidentate or polydentate.',
      'Crystal field splitting explains colour and magnetic behaviour.',
      'IUPAC names list ligands alphabetically before the metal.',
    ],
    definitions: [
      { term: 'Ligand', meaning: 'An ion or molecule that donates an electron pair to a central metal.' },
      { term: 'Chelate', meaning: 'A complex with a ligand that binds the metal at two or more sites.' },
      { term: 'Coordination number', meaning: 'The number of donor atoms bonded to the central metal.' },
    ],
    mnemonics: ['“EDTA is a hexadentate chelator” — six donor sites.'],
    mistakes: ['Counting ligands instead of donor atoms for coordination number.'],
    questions: [
      {
        q: 'The coordination number of [Co(NH₃)₆]³⁺ is:',
        options: ['3', '4', '6', '2'],
        answerIndex: 2,
        explanation: 'Six ammonia ligands each donate one pair, giving coordination number 6.',
        difficulty: 'easy',
      },
    ],
  },
  'quadratic equations': {
    summary:
      'A quadratic equation ax² + bx + c = 0 has at most two roots. The discriminant tells you their nature, and the sum and product of roots come straight from the coefficients.',
    explainer:
      'Use the quadratic formula x = (−b ± √(b² − 4ac)) / 2a. If the discriminant b² − 4ac is positive there are two real roots, zero gives equal roots, and negative gives complex roots. Factorisation is often faster when the numbers cooperate.',
    keyPoints: [
      'Discriminant D = b² − 4ac decides the nature of roots.',
      'Sum of roots = −b/a; product of roots = c/a.',
      'D > 0: two distinct real roots; D = 0: equal roots; D < 0: complex roots.',
      'A quadratic can be written as a(x − α)(x − β) when α, β are roots.',
    ],
    definitions: [
      { term: 'Discriminant', meaning: 'The expression b² − 4ac that determines the nature of the roots.' },
      { term: 'Root', meaning: 'A value of x that makes the quadratic expression zero.' },
      { term: 'Vertex form', meaning: 'a(x − h)² + k, showing the turning point (h, k).' },
    ],
    mnemonics: ['“Minus b, plus-minus root, b squared minus four a c, all over two a.”'],
    mistakes: ['Dropping the ± sign and losing one root.', 'Using the wrong signs for sum (−b/a) and product (c/a).'],
    questions: [
      {
        q: 'The roots of x² − 5x + 6 = 0 are:',
        options: ['2 and 3', '−2 and −3', '1 and 6', '−1 and −6'],
        answerIndex: 0,
        explanation: 'Factorising: (x − 2)(x − 3) = 0, so x = 2 or x = 3.',
        difficulty: 'easy',
      },
      {
        q: 'If the discriminant of a quadratic is negative, the roots are:',
        options: ['Real and equal', 'Real and distinct', 'Complex conjugates', 'Zero'],
        answerIndex: 2,
        explanation: 'A negative discriminant means the square root is imaginary, giving complex conjugate roots.',
        difficulty: 'medium',
      },
      {
        q: 'The sum of roots of 2x² − 8x + 6 = 0 is:',
        options: ['4', '−4', '3', '8'],
        answerIndex: 0,
        explanation: 'Sum = −b/a = 8/2 = 4.',
        difficulty: 'medium',
      },
    ],
  },
  'sequences series': {
    summary:
      'Sequences follow patterns; series add their terms. Arithmetic progressions add a constant difference, while geometric progressions multiply by a constant ratio.',
    explainer:
      'For an AP, the nth term is a + (n − 1)d and the sum is n/2[2a + (n − 1)d]. For a GP, the nth term is ar^(n−1) and the sum is a(1 − rⁿ)/(1 − r) when r ≠ 1. Infinite GPs converge only when |r| < 1.',
    keyPoints: [
      'AP nth term: aₙ = a + (n − 1)d.',
      'AP sum: Sₙ = n/2 [2a + (n − 1)d].',
      'GP nth term: aₙ = ar^(n−1).',
      'Infinite GP sum: S∞ = a/(1 − r) for |r| < 1.',
    ],
    definitions: [
      { term: 'Common difference', meaning: 'The constant added between consecutive terms of an AP.' },
      { term: 'Common ratio', meaning: 'The constant multiplier between consecutive terms of a GP.' },
      { term: 'Arithmetic mean', meaning: 'The average of two numbers, which lies between them in an AP.' },
    ],
    mnemonics: ['“AP adds, GP multiplies.”'],
    mistakes: ['Using n instead of n − 1 in the nth-term formula.', 'Applying the infinite GP formula when |r| ≥ 1.'],
    questions: [
      {
        q: 'The 10th term of the AP 3, 7, 11, … is:',
        options: ['39', '43', '35', '40'],
        answerIndex: 0,
        explanation: 'aₙ = 3 + 9×4 = 39.',
        difficulty: 'easy',
      },
    ],
  },
  trigonometry: {
    summary:
      'Trigonometry relates angles and side lengths. Identities connect sine, cosine and tangent, and sine/cosine rules extend this to non-right triangles.',
    explainer:
      'In a right triangle, sin θ = opposite/hypotenuse. The Pythagorean identity sin²θ + cos²θ = 1 is the workhorse for simplifying expressions. For any triangle, a/sin A = b/sin B = c/sin C and c² = a² + b² − 2ab cos C.',
    keyPoints: [
      'sin²θ + cos²θ = 1; 1 + tan²θ = sec²θ.',
      'Sine rule: a/sin A = b/sin B = c/sin C.',
      'Cosine rule: c² = a² + b² − 2ab cos C.',
      'Know the exact values for 0°, 30°, 45°, 60° and 90°.',
    ],
    definitions: [
      { term: 'Sine', meaning: 'Ratio of the opposite side to the hypotenuse in a right triangle.' },
      { term: 'Radian', meaning: 'An angle measure where one full circle is 2π radians.' },
      { term: 'Amplitude', meaning: 'Half the difference between the maximum and minimum values of a trigonometric function.' },
    ],
    mnemonics: ['“SOH CAH TOA” for sine, cosine and tangent ratios.'],
    mistakes: ['Mixing degrees and radians in the same expression.', 'Forgetting the ambiguous case of the sine rule.'],
    questions: [
      {
        q: 'sin²θ + cos²θ equals:',
        options: ['0', '1', '2', 'tan θ'],
        answerIndex: 1,
        explanation: 'This is the Pythagorean trigonometric identity.',
        difficulty: 'easy',
      },
    ],
  },
  differentiation: {
    summary:
      'Differentiation measures instantaneous rate of change. It powers tangents, optimisation and motion problems.',
    explainer:
      'The derivative is the limit of the difference quotient. Standard rules cover powers, products, quotients and chains. Setting the derivative to zero finds stationary points; the second derivative helps classify them.',
    keyPoints: [
      'd/dx (xⁿ) = nx^(n−1).',
      'Product rule: (uv)′ = u′v + uv′.',
      'Chain rule: d/dx f(g(x)) = f′(g(x))·g′(x).',
      'Stationary points occur where f′(x) = 0.',
    ],
    definitions: [
      { term: 'Derivative', meaning: 'The instantaneous rate of change of a function.' },
      { term: 'Stationary point', meaning: 'A point where the derivative is zero.' },
      { term: 'Second derivative', meaning: 'The derivative of the derivative; it describes concavity.' },
    ],
    mnemonics: ['“Power down, multiply in front, subtract one.”'],
    mistakes: ['Forgetting the chain rule for composite functions.', 'Treating dy/dx as a simple fraction in all contexts.'],
    questions: [
      {
        q: 'The derivative of x³ is:',
        options: ['3x²', 'x²', '3x', 'x⁴/4'],
        answerIndex: 0,
        explanation: 'Using the power rule, d/dx x³ = 3x².',
        difficulty: 'easy',
      },
      {
        q: 'At a local maximum, the first derivative is:',
        options: ['Positive', 'Negative', 'Zero', 'Undefined'],
        answerIndex: 2,
        explanation: 'The tangent is horizontal at a turning point, so f′(x) = 0.',
        difficulty: 'medium',
      },
    ],
  },
  integration: {
    summary:
      'Integration is the reverse of differentiation. Definite integrals measure accumulated change and area under curves.',
    explainer:
      'The fundamental theorem links antiderivatives and area: ∫ₐᵇ f(x) dx = F(b) − F(a). Use substitution to undo chain rules and integration by parts for products. Areas between curves are found by integrating the upper minus lower function.',
    keyPoints: [
      '∫ xⁿ dx = x^(n+1)/(n+1) + C for n ≠ −1.',
      'Definite integral: ∫ₐᵇ f = F(b) − F(a).',
      'Substitution reverses the chain rule.',
      'Area under a curve equals a definite integral.',
    ],
    definitions: [
      { term: 'Antiderivative', meaning: 'A function whose derivative is the given function.' },
      { term: 'Definite integral', meaning: 'The signed area under a curve between two limits.' },
      { term: 'Integration constant', meaning: 'The arbitrary C added to an indefinite integral.' },
    ],
    mnemonics: ['“Integrate = anti-differentiate; add one to the power, divide by the new power.”'],
    mistakes: ['Forgetting the constant C.', 'Ignoring the sign when a curve lies below the x-axis.'],
    questions: [
      {
        q: '∫ 2x dx equals:',
        options: ['x² + C', '2x² + C', 'x + C', '2 + C'],
        answerIndex: 0,
        explanation: 'The antiderivative of 2x is x², plus the constant of integration.',
        difficulty: 'easy',
      },
    ],
  },
  probability: {
    summary:
      'Probability measures uncertainty between 0 and 1. Conditional probability updates belief when new information arrives, and Bayes’ theorem reverses conditionals.',
    explainer:
      'For equally likely outcomes, P(A) = favourable/total. P(A ∪ B) = P(A) + P(B) − P(A ∩ B). Conditional probability is P(A|B) = P(A ∩ B)/P(B). Bayes’ theorem rewrites this in terms of likelihoods, and the binomial distribution counts successes in fixed trials.',
    keyPoints: [
      '0 ≤ P(A) ≤ 1 and P(not A) = 1 − P(A).',
      'P(A ∪ B) = P(A) + P(B) − P(A ∩ B).',
      'P(A|B) = P(A ∩ B)/P(B).',
      'Independent events: P(A ∩ B) = P(A)P(B).',
    ],
    definitions: [
      { term: 'Sample space', meaning: 'The set of all possible outcomes of an experiment.' },
      { term: 'Conditional probability', meaning: 'The probability of A given that B has occurred.' },
      { term: 'Binomial distribution', meaning: 'The distribution of successes in n independent trials with two outcomes.' },
    ],
    mnemonics: ['“P(A|B) is A inside B, divided by B.”'],
    mistakes: ['Assuming events are independent when they are not.', 'Forgetting to subtract the overlap in the addition rule.'],
    questions: [
      {
        q: 'The probability of an impossible event is:',
        options: ['1', '0', '0.5', 'Undefined'],
        answerIndex: 1,
        explanation: 'By definition, P(impossible event) = 0.',
        difficulty: 'easy',
      },
      {
        q: 'For independent events A and B, P(A ∩ B) is:',
        options: ['P(A) + P(B)', 'P(A) − P(B)', 'P(A)P(B)', 'P(A)/P(B)'],
        answerIndex: 2,
        explanation: 'Independence multiplies the individual probabilities.',
        difficulty: 'medium',
      },
    ],
  },
  vectors: {
    summary:
      'Vectors have magnitude and direction. Dot products measure alignment, cross products measure perpendicularity and rotation.',
    explainer:
      'A·B = |A||B| cos θ (scalar), while A×B = |A||B| sin θ (vector). A dot product of zero means perpendicular; a cross product of zero means parallel. Components make addition and resolution straightforward.',
    keyPoints: [
      'A·B = |A||B| cos θ; zero for perpendicular vectors.',
      '|A×B| = |A||B| sin θ; direction given by the right-hand rule.',
      'A unit vector has magnitude 1.',
      'The projection of A on B uses the dot product.',
    ],
    definitions: [
      { term: 'Unit vector', meaning: 'A vector of length one showing direction only.' },
      { term: 'Dot product', meaning: 'A scalar product equal to |A||B| cos θ.' },
      { term: 'Cross product', meaning: 'A vector product with magnitude |A||B| sin θ.' },
    ],
    mnemonics: ['“Dot is cosine, cross is sine.”'],
    mistakes: ['Treating the dot product as a vector.', 'Forgetting the right-hand rule direction for cross products.'],
    questions: [
      {
        q: 'If A·B = 0 for non-zero vectors, the vectors are:',
        options: ['Parallel', 'Perpendicular', 'Identical', 'Opposite'],
        answerIndex: 1,
        explanation: 'cos 90° = 0, so a zero dot product indicates perpendicular vectors.',
        difficulty: 'easy',
      },
    ],
  },
  photosynthesis: {
    summary:
      'Photosynthesis converts light energy into chemical energy. Plants use chlorophyll to split water, release oxygen and fix carbon dioxide into glucose.',
    explainer:
      'The light-dependent reactions in the thylakoids produce ATP and NADPH while splitting water. The Calvin cycle in the stroma uses ATP and NADPH to fix CO₂ into glucose. Chlorophyll absorbs blue and red light and reflects green.',
    keyPoints: [
      'Overall: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂.',
      'Light reactions occur in the thylakoid membranes and produce ATP and NADPH.',
      'The Calvin cycle fixes carbon in the stroma.',
      'Chlorophyll a and b absorb mainly blue and red light.',
    ],
    definitions: [
      { term: 'Chlorophyll', meaning: 'The green pigment that absorbs light for photosynthesis.' },
      { term: 'Stomata', meaning: 'Pores on leaves that allow gas exchange.' },
      { term: 'Calvin cycle', meaning: 'The light-independent reactions that fix CO₂ into sugar.' },
    ],
    mnemonics: ['“Water splits in light, carbon fixes in the dark reactions.”'],
    mistakes: [
      'Saying plants release oxygen at night — oxygen comes from the light reactions.',
      'Thinking the Calvin cycle requires darkness rather than simply not directly requiring light.',
    ],
    questions: [
      {
        q: 'Oxygen released during photosynthesis comes from:',
        options: ['Carbon dioxide', 'Water', 'Glucose', 'Chlorophyll'],
        answerIndex: 1,
        explanation: 'Photolysis of water in the light reactions releases oxygen.',
        difficulty: 'easy',
      },
      {
        q: 'The Calvin cycle takes place in the:',
        options: ['Thylakoid membrane', 'Stroma', 'Mitochondria', 'Nucleus'],
        answerIndex: 1,
        explanation: 'Carbon fixation happens in the stroma of the chloroplast.',
        difficulty: 'medium',
      },
      {
        q: 'Chlorophyll mainly absorbs which colours of light?',
        options: ['Green and yellow', 'Blue and red', 'Green and violet', 'Only red'],
        answerIndex: 1,
        explanation: 'Chlorophyll absorbs blue and red light and reflects green light.',
        difficulty: 'easy',
      },
    ],
  },
  'human digestive system': {
    summary:
      'The digestive system breaks food into absorbable nutrients. Mechanical and chemical digestion work together from the mouth to the small intestine, with enzymes specific to each nutrient.',
    explainer:
      'Digestion begins in the mouth with amylase. The stomach uses acid and pepsin for proteins. The small intestine completes digestion with pancreatic and intestinal enzymes and absorbs nutrients through villi. The large intestine reabsorbs water.',
    keyPoints: [
      'Amylase digests starch into sugars, starting in the mouth.',
      'Pepsin digests proteins in the acidic stomach.',
      'Bile emulsifies fats; lipase breaks them down.',
      'Villi increase the surface area for absorption in the small intestine.',
    ],
    definitions: [
      { term: 'Peristalsis', meaning: 'Wave-like muscular contractions that push food along the gut.' },
      { term: 'Villi', meaning: 'Finger-like projections that increase intestinal surface area.' },
      { term: 'Enzyme', meaning: 'A biological catalyst that speeds up digestion.' },
    ],
    mnemonics: ['“Mouth starch, stomach protein, intestine fats” for where digestion starts.'],
    mistakes: ['Saying absorption happens mainly in the stomach — most absorption is in the small intestine.'],
    questions: [
      {
        q: 'Most nutrient absorption occurs in the:',
        options: ['Stomach', 'Small intestine', 'Large intestine', 'Oesophagus'],
        answerIndex: 1,
        explanation: 'Villi in the small intestine provide a large surface for absorption.',
        difficulty: 'easy',
      },
    ],
  },
  genetics: {
    summary:
      'Genetics studies inheritance. Mendel’s laws explain how alleles segregate and assort independently, while Punnett squares predict offspring ratios.',
    explainer:
      'An organism carries two alleles per gene. Dominant alleles mask recessive ones in heterozygotes. A monohybrid cross gives a 3:1 phenotype ratio, and a dihybrid cross gives 9:3:3:1 when genes assort independently.',
    keyPoints: [
      'Genotype is the allele combination; phenotype is the observable trait.',
      'Law of segregation: alleles separate during gamete formation.',
      'Law of independent assortment applies to genes on different chromosomes.',
      'A monohybrid cross of heterozygotes yields 3:1 phenotypes.',
    ],
    definitions: [
      { term: 'Allele', meaning: 'A version of a gene.' },
      { term: 'Heterozygous', meaning: 'Carrying two different alleles for a gene.' },
      { term: 'Punnett square', meaning: 'A grid used to predict offspring genotypes.' },
    ],
    mnemonics: ['“Dominant shows, recessive hides.”'],
    mistakes: ['Confusing genotype (letters) with phenotype (appearance).', 'Assuming linked genes assort independently.'],
    questions: [
      {
        q: 'A cross between two heterozygotes (Tt × Tt) gives a phenotype ratio of:',
        options: ['1:1', '3:1', '1:2:1', '9:3:3:1'],
        answerIndex: 1,
        explanation: 'TT, Tt and tT show the dominant trait; only tt shows the recessive trait, giving 3:1.',
        difficulty: 'easy',
      },
      {
        q: 'The observable characteristic of an organism is its:',
        options: ['Genotype', 'Phenotype', 'Allele', 'Karyotype'],
        answerIndex: 1,
        explanation: 'Phenotype is the visible or measurable trait.',
        difficulty: 'easy',
      },
    ],
  },
  'cell structure': {
    summary:
      'Cells are the basic units of life. Prokaryotes lack membrane-bound organelles; eukaryotes compartmentalise functions into organelles such as the nucleus, mitochondria and chloroplasts.',
    explainer:
      'The plasma membrane controls what enters and leaves. The nucleus stores DNA, ribosomes build proteins, mitochondria release energy and chloroplasts perform photosynthesis. The endomembrane system packages and transports proteins and lipids.',
    keyPoints: [
      'Prokaryotes lack a nucleus; eukaryotes have a membrane-bound nucleus.',
      'Mitochondria are the site of aerobic respiration.',
      'Ribosomes synthesise proteins.',
      'The plasma membrane is a selectively permeable phospholipid bilayer.',
    ],
    definitions: [
      { term: 'Organelle', meaning: 'A specialised structure inside a cell that performs a specific function.' },
      { term: 'Prokaryote', meaning: 'A cell without a membrane-bound nucleus.' },
      { term: 'Cytoplasm', meaning: 'The jelly-like substance filling the cell outside the nucleus.' },
    ],
    mnemonics: ['“Mighty mitochondria make energy; ribosomes build; nucleus stores.”'],
    mistakes: ['Saying prokaryotes have no ribosomes — they do, just without membranes.', 'Thinking plant cells lack mitochondria.'],
    questions: [
      {
        q: 'The powerhouse of the cell is the:',
        options: ['Nucleus', 'Mitochondrion', 'Ribosome', 'Golgi body'],
        answerIndex: 1,
        explanation: 'Mitochondria carry out aerobic respiration and produce ATP.',
        difficulty: 'easy',
      },
    ],
  },
  ecology: {
    summary:
      'Ecology studies interactions between organisms and their environment. Energy flows through food chains, nutrients cycle, and biodiversity keeps ecosystems resilient.',
    explainer:
      'Producers capture energy, consumers transfer it, and decomposers recycle nutrients. Only about 10% of energy passes to the next trophic level, which is why food chains are short. Human activity can disrupt nutrient cycles and reduce biodiversity.',
    keyPoints: [
      'Energy flows one way; nutrients cycle.',
      'Only ~10% of energy transfers between trophic levels.',
      'Decomposers return nutrients to the soil.',
      'Biodiversity supports ecosystem stability.',
    ],
    definitions: [
      { term: 'Ecosystem', meaning: 'A community of organisms and their physical environment.' },
      { term: 'Trophic level', meaning: 'A feeding position in a food chain.' },
      { term: 'Biodiversity', meaning: 'The variety of life in an ecosystem.' },
    ],
    mnemonics: ['“Producers → consumers → decomposers” — the energy relay.'],
    mistakes: ['Confusing food chains (energy) with nutrient cycles (matter).'],
    questions: [
      {
        q: 'The 10% law of energy transfer was given by:',
        options: ['Darwin', 'Lindeman', 'Mendel', 'Hooke'],
        answerIndex: 1,
        explanation: 'Lindeman proposed that roughly 10% of energy passes to the next trophic level.',
        difficulty: 'medium',
      },
    ],
  },
  'nervous system': {
    summary:
      'The nervous system coordinates rapid responses. Neurons transmit electrochemical signals, and the brain and spinal cord integrate information.',
    explainer:
      'A neuron has dendrites, a cell body and an axon. Signals travel as action potentials and cross synapses via neurotransmitters. The CNS comprises the brain and spinal cord; the PNS connects the body. Reflex actions bypass conscious decision-making via the spinal cord.',
    keyPoints: [
      'Neurons transmit electrical impulses over long distances.',
      'Synapses use chemical neurotransmitters to pass signals between neurons.',
      'The CNS is the brain plus spinal cord.',
      'Reflex arcs enable fast protective responses.',
    ],
    definitions: [
      { term: 'Neuron', meaning: 'The structural and functional unit of the nervous system.' },
      { term: 'Synapse', meaning: 'The junction where a signal passes from one neuron to another.' },
      { term: 'Reflex action', meaning: 'An involuntary, rapid response to a stimulus.' },
    ],
    mnemonics: ['“Dendrite in, axon out” — direction of a nerve impulse.'],
    mistakes: ['Saying signals cross synapses electrically — they use neurotransmitters.'],
    questions: [
      {
        q: 'The gap between two neurons is called a:',
        options: ['Dendrite', 'Synapse', 'Axon', 'Myelin sheath'],
        answerIndex: 1,
        explanation: 'The synapse is the junction where neurotransmitters carry the signal across.',
        difficulty: 'easy',
      },
    ],
  },
  'reading comprehension': {
    summary:
      'Reading comprehension tests your ability to find, interpret and evaluate information in a passage. Strong readers preview questions, track main ideas and support answers with evidence.',
    explainer:
      'Skim for structure first, then read closely for detail. Distinguish main idea from supporting detail, and inference from explicit statement. Wrong options often reuse passage words with a twisted meaning.',
    keyPoints: [
      'Preview questions before reading the passage.',
      'Identify the main idea and the author’s tone.',
      'Support every answer with a line from the passage.',
      'Eliminate options that are true but not supported.',
    ],
    definitions: [
      { term: 'Inference', meaning: 'A conclusion drawn from evidence rather than stated directly.' },
      { term: 'Main idea', meaning: 'The central point that the passage develops.' },
      { term: 'Tone', meaning: 'The author’s attitude towards the subject.' },
    ],
    mnemonics: ['“Find, infer, evaluate” — the three comprehension moves.'],
    mistakes: ['Choosing an answer because it sounds true rather than because the passage supports it.'],
    questions: [
      {
        q: 'An inference is best described as:',
        options: ['A direct quotation', 'A conclusion based on evidence', 'A summary of the title', 'A grammatical rule'],
        answerIndex: 1,
        explanation: 'Inference means reading between the lines using textual evidence.',
        difficulty: 'easy',
      },
    ],
  },
  'essay writing': {
    summary:
      'Strong essays have a clear thesis, organised paragraphs and evidence. Structure and coherence matter as much as vocabulary.',
    explainer:
      'Open with a hook and thesis, develop one idea per paragraph with evidence, and close by linking back to the thesis. Use transitions to guide the reader and vary sentence length for rhythm.',
    keyPoints: [
      'State a clear thesis in the introduction.',
      'One central idea per body paragraph.',
      'Support claims with examples or evidence.',
      'Conclude by reinforcing the thesis, not by adding new arguments.',
    ],
    definitions: [
      { term: 'Thesis', meaning: 'The central argument of an essay.' },
      { term: 'Coherence', meaning: 'Logical connection and flow between ideas.' },
      { term: 'Transition', meaning: 'A word or phrase that links paragraphs or ideas.' },
    ],
    mnemonics: ['“Hook, thesis, body, echo” — essay skeleton.'],
    mistakes: ['Putting new evidence in the conclusion.', 'Writing paragraphs that contain two unrelated ideas.'],
    questions: [
      {
        q: 'The central argument of an essay is called the:',
        options: ['Hook', 'Thesis', 'Transition', 'Conclusion'],
        answerIndex: 1,
        explanation: 'The thesis states the essay’s main claim.',
        difficulty: 'easy',
      },
    ],
  },
  'grammar essentials': {
    summary:
      'Grammar keeps writing clear and unambiguous. Subject–verb agreement, tense consistency and correct article use are the most common exam traps.',
    explainer:
      'A singular subject takes a singular verb. Prepositional phrases between subject and verb do not change agreement. Use tense consistently and let articles match whether a noun is specific (the) or general (a/an).',
    keyPoints: [
      'Subject and verb must agree in number.',
      'Ignore phrases between the subject and verb when checking agreement.',
      'Use “a” before consonant sounds and “an” before vowel sounds.',
      'Keep tenses consistent within a paragraph.',
    ],
    definitions: [
      { term: 'Subject–verb agreement', meaning: 'Matching the number of the subject and verb.' },
      { term: 'Article', meaning: 'A, an or the, used before nouns.' },
      { term: 'Tense', meaning: 'The grammatical form that shows time.' },
    ],
    mnemonics: ['“One subject, one verb” — singular subject, singular verb.'],
    mistakes: ['Matching the verb to the nearest noun instead of the subject.'],
    questions: [
      {
        q: 'Choose the correct sentence:',
        options: ['The list of items are on the desk.', 'The list of items is on the desk.', 'The lists of item is on the desk.', 'The list of item are on the desk.'],
        answerIndex: 1,
        explanation: '“List” is singular, so the verb should be “is”; the phrase “of items” does not change it.',
        difficulty: 'easy',
      },
    ],
  },
  vocabulary: {
    summary:
      'A strong vocabulary comes from context, roots and regular use. Learning word families and roots helps you decode unfamiliar words in exams.',
    explainer:
      'Use context clues to infer meaning, then confirm with roots or prefixes. Common roots like “bene” (good) and “mal” (bad) unlock many words. Review in spaced intervals rather than cramming.',
    keyPoints: [
      'Use surrounding words as context clues.',
      'Learn common prefixes, roots and suffixes.',
      'Group new words by theme or word family.',
      'Review vocabulary at spaced intervals.',
    ],
    definitions: [
      { term: 'Synonym', meaning: 'A word with a similar meaning.' },
      { term: 'Antonym', meaning: 'A word with the opposite meaning.' },
      { term: 'Context clue', meaning: 'A hint about a word’s meaning from its surroundings.' },
    ],
    mnemonics: ['“Bene = good, mal = bad” to recall word roots.'],
    mistakes: ['Learning words without example sentences.'],
    questions: [
      {
        q: 'A word with the opposite meaning is called an:',
        options: ['Synonym', 'Antonym', 'Homonym', 'Acronym'],
        answerIndex: 1,
        explanation: 'An antonym expresses the opposite meaning.',
        difficulty: 'easy',
      },
    ],
  },
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function findKnowledge(topicName: string): TopicKnowledge | null {
  const normalized = normalize(topicName)
  if (!normalized) return null
  for (const key of Object.keys(K)) {
    if (normalized === key || normalized.includes(key) || key.includes(normalized)) return K[key]
  }
  const words = normalized.split(' ').filter((w) => w.length > 3)
  for (const key of Object.keys(K)) {
    if (words.some((w) => key.includes(w))) return K[key]
  }
  return null
}

export const topicSeeds: Record<string, { topic: string; difficulty: 'easy' | 'medium' | 'hard' }[]> = {
  physics: [
    { topic: 'Laws of Motion', difficulty: 'medium' },
    { topic: 'Work Energy & Power', difficulty: 'easy' },
    { topic: 'Rotational Motion', difficulty: 'hard' },
    { topic: 'Thermodynamics', difficulty: 'medium' },
    { topic: 'Waves', difficulty: 'medium' },
    { topic: 'Electrostatics', difficulty: 'hard' },
    { topic: 'Current Electricity', difficulty: 'medium' },
    { topic: 'Optics', difficulty: 'medium' },
  ],
  chemistry: [
    { topic: 'Chemical Bonding', difficulty: 'medium' },
    { topic: 'Equilibrium', difficulty: 'medium' },
    { topic: 'Organic Chemistry Basics', difficulty: 'hard' },
    { topic: 'Electrochemistry', difficulty: 'hard' },
    { topic: 'Coordination Compounds', difficulty: 'hard' },
    { topic: 'Thermodynamics', difficulty: 'medium' },
  ],
  mathematics: [
    { topic: 'Quadratic Equations', difficulty: 'easy' },
    { topic: 'Sequences & Series', difficulty: 'medium' },
    { topic: 'Trigonometry', difficulty: 'medium' },
    { topic: 'Differentiation', difficulty: 'medium' },
    { topic: 'Integration', difficulty: 'hard' },
    { topic: 'Probability', difficulty: 'medium' },
    { topic: 'Vectors', difficulty: 'medium' },
  ],
  biology: [
    { topic: 'Photosynthesis', difficulty: 'easy' },
    { topic: 'Human Digestive System', difficulty: 'medium' },
    { topic: 'Genetics', difficulty: 'medium' },
    { topic: 'Cell Structure', difficulty: 'easy' },
    { topic: 'Ecology', difficulty: 'medium' },
    { topic: 'Nervous System', difficulty: 'medium' },
  ],
  english: [
    { topic: 'Reading Comprehension', difficulty: 'easy' },
    { topic: 'Essay Writing', difficulty: 'medium' },
    { topic: 'Grammar Essentials', difficulty: 'easy' },
    { topic: 'Vocabulary', difficulty: 'easy' },
  ],
}

export function topicsForSubjectName(subjectName: string) {
  const n = normalize(subjectName)
  if (n.includes('physic')) return topicSeeds.physics
  if (n.includes('chem')) return topicSeeds.chemistry
  if (n.includes('math') || n.includes('algebra')) return topicSeeds.mathematics
  if (n.includes('bio')) return topicSeeds.biology
  if (n.includes('english') || n.includes('literature')) return topicSeeds.english
  return null
}

export function genericKnowledge(topic: string): TopicKnowledge {
  return {
    summary: `${topic} is a core idea in this subject. Focus on the fundamental definitions, how the concepts connect, and the worked examples that appear most often in exams.`,
    explainer: `Break ${topic} into three layers: what it is, why it matters, and how it is applied. Start with the definition, sketch the underlying relationship, then work through one solved example from your notes before attempting practice questions.`,
    keyPoints: [
      `${topic} builds on earlier concepts — make sure the prerequisites are clear.`,
      'Learn the formal definition and one concrete example for each term.',
      'Practice the standard question patterns before attempting tricky variants.',
      'Review mistakes and turn each one into a quick flashcard.',
    ],
    definitions: [
      { term: topic, meaning: `The core concept behind ${topic}, including its definition, assumptions and standard applications.` },
      { term: 'Prerequisite', meaning: `An earlier idea that ${topic} depends on.` },
      { term: 'Application', meaning: `A context where ${topic} is used to solve a problem or explain a phenomenon.` },
    ],
    mnemonics: [`Turn the key terms of ${topic} into a short acronym and recall it before practice questions.`],
    mistakes: [
      'Memorising steps without understanding the underlying relationship.',
      'Skipping practice questions after reading the notes once.',
    ],
    questions: [
      {
        q: `Which approach is most effective for mastering ${topic}?`,
        options: [
          'Only re-reading the notes',
          'Understanding the concept, then practising questions',
          'Memorising unrelated facts',
          'Skipping the fundamentals',
        ],
        answerIndex: 1,
        explanation: `Understanding the core idea of ${topic} first, then practising, builds durable recall.`,
        difficulty: 'easy',
      },
      {
        q: `A strong first step when studying ${topic} is to:`,
        options: ['Attempt an advanced mock test', 'Clarify the definition and prerequisites', 'Memorise the last page', 'Skip to another subject'],
        answerIndex: 1,
        explanation: 'Clear definitions and prerequisites prevent confusion later.',
        difficulty: 'easy',
      },
    ],
  }
}
