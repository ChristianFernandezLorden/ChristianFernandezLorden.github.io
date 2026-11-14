---
title: The trace on the home page
summary: The line at the top of this site is a simulated neuron, made of a sigmoid in positive feedback with a high-pass filter.
tags: [excitability]
explains_trace: true
---

The line at the top of the [home page]({{ '/' | relative_url }}) is a two-variable model of a neuron, integrated in your browser, and every click sends it an input pulse.

Here it is again, with two sliders to shape the pulse:

{% include trace.html controls=true %}

## The model

The trace is a High-Pass (HP) neuron: a sigmoid $$\sigma$$ in positive feedback with the first-order high-pass filter $$\tau s/(\tau s + 1)$$. Written with the state $$x$$ of the low-pass filter from which the high-pass filter is built, and with a fast lag $$\varepsilon$$ on the input $$v$$ of the sigmoid, it reads

$$
\begin{aligned}
\varepsilon\,\dot v &= -v + u(t) + \sigma(v) - x, \\
\tau\,\dot x &= -x + \sigma(v),
\end{aligned}
$$

with $$\sigma(v) = k \tanh(v)$$, $$k = 3$$, $$\tau = 20$$ and $$\varepsilon = 1$$. The term $$\sigma(v) - x$$ is $$\sigma(v)$$ seen through the high-pass filter: $$x$$ is a slow copy of $$\sigma(v)$$, and the filter returns what is left once it is subtracted. Since $$\varepsilon \ll \tau$$, $$v$$ is fast and $$x$$ is slow. In the limit $$\varepsilon \to 0$$ the first equation becomes the algebraic loop $$v = u + \sigma(v) - x$$.
This is a causal variant of the model presented in {% include ref.html key="two-block-excitability-poster" %}.

The filter blocks DC, so at rest the feedback vanishes and the equilibrium is

$$
v^\star = u, \qquad x^\star = \sigma(u),
$$

whatever the gain. The input sets the operating point, and with it the local slope $$\sigma'(u)$$ of the sigmoid. Through linearization and study of the Jacobian, one can show the equilibrium is locally stable as long as

$$
\sigma'(u) < 1 + \frac{\varepsilon}{\tau} .
$$

In the limit $$\varepsilon \to 0$$ this is $$\sigma'(u) < 1$$: the neuron rests whenever $$u$$ lies outside the high-gain zone $$(a, b)$$ of the sigmoid, where its slope exceeds 1, and spikes periodically inside it. For $$\sigma(v) = 3\tanh(v)$$ the high-gain zone is $$\lvert u \rvert < 1.15$$; with $$\varepsilon/\tau = 0.05$$, the rest point is locally stable for $$\lvert u \rvert < 1.12$$. The home page holds $$u = -1.6$$, outside it. This is the flat line you see when nothing happens.

## The input

A click does not move $$u$$ directly. It sends an impulse through a second-order low-pass filter, $$1/(\tau_\mathrm{in} s+1)^2$$, and the response is added to the resting input $$u_0 = -1.6$$:

$$
u(t) = u_0 + A\,\frac{t}{\tau_\mathrm{in}}\,e^{\,1 - t/\tau_\mathrm{in}}.
$$

The pulse rises, peaks at $$A$$ when $$t = \tau_\mathrm{in}$$, and decays. The two sliders above set the amplitude $$A$$ and the time constant $$\tau_\mathrm{in}$$. On the trace the input $$u$$ is the thin grey line and $$v$$ the coloured one. Both are drawn on the same scale, so at rest they coincide.

## Why it spikes

The pulse pushes $$v$$ into the high-gain zone, where the slope of $$\sigma$$ exceeds 1. There the positive feedback takes over: $$v$$ jumps up until the sigmoid saturates. Then the filter does its work. As $$x$$ catches up with $$\sigma(v)$$ the feedback washes out and $$v$$ slides back down, until it falls through the high-gain zone again, drops below its resting value and slowly recovers.

The home page uses $$A = 1$$ and $$\tau_\mathrm{in} = 2$$. For that time constant the threshold is about $$A = 0.36$$. A shorter pulse has to be stronger: with $$\tau_\mathrm{in} = 0.5$$ the threshold is about $$0.84$$. A characterization of the dynamic threshold when $$\varepsilon\to0$$ can be found in {% include ref.html key="excitability-high-pass-threshold-paper" %}.

Click twice in a row and the second pulse does very little. Right after a spike $$x$$ is still far from its resting value and holds $$v$$ down. This is the refractory period.

## The same thing in Julia

The page uses forward Euler with a step of 0.02, which is more than enough here. The simulation fits in a few lines:

```julia
k, τ, ε = 3.0, 20.0, 1.0
σ(v) = k * tanh(v)
A, τin = 1.0, 2.0
u(t) = -1.6 + A * (t / τin) * exp(1 - t / τin)    # resting input plus one pulse

function simulate(; tmax = 80.0, dt = 0.02)
    v, x = -1.6, σ(-1.6)                          # resting point
    vs = Float64[]
    for t in 0:dt:tmax
        dv = (-v + u(t) + σ(v) - x) / ε
        dx = (-x + σ(v)) / τ
        v += dt * dv
        x += dt * dx
        push!(vs, v)
    end
    return vs
end
```

However, a more intelligent implementation would be using [``DifferentialEquations.jl``](https://docs.sciml.ai/DiffEqDocs/stable/).

```julia
import DifferentialEquations as DE

k, τ, ε = 3.0, 20.0, 1.0
σ(v) = k * tanh(v)
A, τin = 1.0, 2.0
u(t) = -1.6 + A * (t / τin) * exp(1 - t / τin)    # resting input plus one pulse

function hp_neuron!(dX, X, p, t)
    v, x = X
    dX[1] = (-v + p.u(t) + p.σ(v) - x) / p.ε
    dX[2] = (-x + p.σ(v)) / p.τ
end

p = (σ=σ, τ=τ, ε=ε, u=u)
tspan = (0.0, 80.0)
X0 = [-1.6, σ(-1.6)]                              # resting point

prob = DE.ODEProblem(hp_neuron!, X0, tspan, p)
sol = DE.solve(prob, DE.Rodas5P(); dt=0.02, saveat=0.02)
```

The JavaScript version that draws the trace is in `assets/js/trace.js`.
